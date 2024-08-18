import {
  Injectable,
  NotFoundException,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import {
  CicdPipelineDto,
  CreateCicdPipelineDto,
  CicdPipelineRunDto,
  CreateCicdPipelineRunDto,
  CicdPipelineStepMeasurementDto,
  CreateCicdPipelineStepMeasurementDto,
} from '../dtos/cicd.dto';
import { PrismaService } from './prisma.service';
import {
  CicdStepName,
  DeploymentSubStepName,
  IntegrationSubStepName,
} from '@prisma/client';

@Injectable()
export class CicdService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  async createPipeline(
    createDto: CreateCicdPipelineDto,
  ): Promise<CicdPipelineDto> {
    const pipeline = await this.prismaService.cicdPipeline.create({
      data: {
        ...createDto,
        tags: {
          connectOrCreate: createDto.tags.map((tag) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
      },
      include: { tags: true },
    });

    return {
      ...pipeline,
      totalCo2: 0,
      tags: pipeline.tags.map((tag) => tag.name),
    };
  }

  async getPipeline(pipelineId: number): Promise<CicdPipelineDto> {
    const pipeline = await this.prismaService.cicdPipeline.findUnique({
      where: { id: pipelineId },
      include: {
        tags: true,
        cicdPipelineRuns: {
          include: {
            cicdPipelineStepMeasurements: true,
          },
        },
      },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID ${pipelineId} not found`);
    }

    return {
      ...pipeline,
      totalCo2: this.calculateTotalCo2ForPipeline(pipeline),
      tags: pipeline.tags.map((tag) => tag.name),
    };
  }

  async createPipelineRun(
    pipelineId: number,
    createDto: CreateCicdPipelineRunDto,
  ): Promise<CicdPipelineRunDto> {
    const pipeline = await this.prismaService.cicdPipeline.findUnique({
      where: { id: pipelineId },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID ${pipelineId} not found`);
    }

    const pipelineRun = await this.prismaService.cicdPipelineRun.create({
      data: {
        ...createDto,
        cicdPipelineId: pipelineId,
      },
    });

    return { ...pipelineRun, totalCo2: 0 };
  }

  async getPipelineRuns(pipelineId: number): Promise<CicdPipelineRunDto[]> {
    const pipelineRuns = await this.prismaService.cicdPipelineRun.findMany({
      where: {
        cicdPipelineId: pipelineId,
      },
      include: {
        cicdPipelineStepMeasurements: true,
      },
    });

    return pipelineRuns.map((run) => ({
      ...run,
      totalCo2: this.calculateTotalCo2ForRun(run),
    }));
  }

  async createStepMeasurement(
    pipelineId: number,
    runId: number,
    createDto: CreateCicdPipelineStepMeasurementDto,
  ): Promise<CicdPipelineStepMeasurementDto> {
    const pipelineRun = await this.prismaService.cicdPipelineRun.findFirst({
      where: {
        id: runId,
        cicdPipelineId: pipelineId,
      },
    });

    if (!pipelineRun) {
      throw new NotFoundException(
        `Pipeline run with ID ${runId} not found for pipeline ${pipelineId}`,
      );
    }

    // Validate step name
    if (!Object.values(CicdStepName).includes(createDto.stepName)) {
      throw new BadRequestException(
        `Invalid step name. Available options are: ${Object.values(CicdStepName).join(', ')}`,
      );
    }

    // Validate integration sub-step name if present
    if (
      createDto.integrationSubStepName &&
      !Object.values(IntegrationSubStepName).includes(
        createDto.integrationSubStepName,
      )
    ) {
      throw new BadRequestException(
        `Invalid integration sub-step name. Available options are: ${Object.values(IntegrationSubStepName).join(', ')}`,
      );
    }

    // Validate deployment stage if present
    if (
      createDto.deploymentStage &&
      !Object.values(DeploymentSubStepName).includes(createDto.deploymentStage)
    ) {
      throw new BadRequestException(
        `Invalid deployment stage. Available options are: ${Object.values(DeploymentSubStepName).join(', ')}`,
      );
    }

    return this.prismaService.cicdPipelineStepMeasurement.create({
      data: {
        ...createDto,
        cicdPipelineRunId: runId,
      },
    });
  }

  async getStepMeasurements(
    pipelineId: number,
    runId: number,
  ): Promise<CicdPipelineStepMeasurementDto[]> {
    const pipelineRun = await this.prismaService.cicdPipelineRun.findFirst({
      where: {
        id: runId,
        cicdPipelineId: pipelineId,
      },
      include: {
        cicdPipelineStepMeasurements: true,
      },
    });

    if (!pipelineRun) {
      throw new NotFoundException(
        `Pipeline run with ID ${runId} not found for pipeline ${pipelineId}`,
      );
    }

    return pipelineRun.cicdPipelineStepMeasurements;
  }

  async getPipelinesByTags(
    tags: string[],
    matchAll: boolean = false,
  ): Promise<CicdPipelineDto[]> {
    let whereCondition;

    if (matchAll) {
      whereCondition = {
        AND: tags.map((tag) => ({
          tags: {
            some: {
              name: tag,
            },
          },
        })),
      };
    } else {
      whereCondition = {
        tags: {
          some: {
            name: {
              in: tags,
            },
          },
        },
      };
    }

    const pipelines = await this.prismaService.cicdPipeline.findMany({
      where: whereCondition,
      include: {
        tags: true,
        cicdPipelineRuns: {
          include: {
            cicdPipelineStepMeasurements: true,
          },
          orderBy: {
            startTime: 'desc',
          },
        },
      },
    });

    return Promise.all(pipelines.map(this.mapToCicdPipelineDto.bind(this)));
  }

  private async mapToCicdPipelineDto(pipeline: any): Promise<CicdPipelineDto> {
    const weeklyCo2Consumption = await this.calculateWeeklyCo2Consumption(
      pipeline.id,
    );
    const lastRun = pipeline.cicdPipelineRuns[0]; // Assuming runs are ordered by startTime desc
    const [integrationConsumption, deploymentConsumption] =
      this.calculateLastRunConsumption(lastRun);

    return {
      id: pipeline.id,
      repoName: pipeline.repoName,
      branch: pipeline.branch,
      cloudProvider: pipeline.cloudProvider,
      pipelineName: pipeline.pipelineName,
      totalCo2: this.calculateTotalCo2ForPipeline(pipeline),
      tags: pipeline.tags.map((tag) => tag.name),
      keyMetrics: {
        weekly_co2_consumption: weeklyCo2Consumption,
        integration_consumption_last_run: integrationConsumption,
        deployment_consumption_last_run: deploymentConsumption,
      },
    };
  }

  private async calculateWeeklyCo2Consumption(
    pipelineId: number,
  ): Promise<number> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentRuns = await this.prismaService.cicdPipelineRun.findMany({
      where: {
        cicdPipelineId: pipelineId,
        startTime: {
          gte: oneWeekAgo,
        },
      },
      include: {
        cicdPipelineStepMeasurements: true,
      },
    });

    return recentRuns.reduce(
      (total, run) => total + this.calculateTotalCo2ForRun(run),
      0,
    );
  }

  private calculateLastRunConsumption(lastRun: any): [number, number] {
    if (!lastRun) return [0, 0];

    const integrationConsumption = lastRun.cicdPipelineStepMeasurements
      .filter(
        (measurement) => measurement.stepName === CicdStepName.integration,
      )
      .reduce((total, measurement) => total + measurement.co2Consumption, 0);

    const deploymentConsumption = lastRun.cicdPipelineStepMeasurements
      .filter((measurement) => measurement.stepName === CicdStepName.deployment)
      .reduce((total, measurement) => total + measurement.co2Consumption, 0);

    return [integrationConsumption, deploymentConsumption];
  }

  private calculateTotalCo2ForPipeline(pipeline: any): number {
    return pipeline.cicdPipelineRuns.reduce(
      (total: number, run: any) => total + this.calculateTotalCo2ForRun(run),
      0,
    );
  }

  private calculateTotalCo2ForRun(run: any): number {
    return run.cicdPipelineStepMeasurements.reduce(
      (total: number, measurement: any) => total + measurement.co2Consumption,
      0,
    );
  }
}
