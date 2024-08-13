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
        tags: JSON.stringify(createDto.tags),
      },
    });

    return {
      ...pipeline,
      totalCo2: 0,
      tags: JSON.parse(pipeline.tags as string),
    };
  }

  async getPipelines(): Promise<CicdPipelineDto[]> {
    const pipelines = await this.prismaService.cicdPipeline.findMany({
      include: {
        cicdPipelineRuns: {
          include: {
            cicdPipelineStepMeasurements: true,
          },
        },
      },
    });

    return pipelines.map((pipeline) => ({
      ...pipeline,
      totalCo2: this.calculateTotalCo2ForPipeline(pipeline),
      tags: JSON.parse(pipeline.tags as string),
    }));
  }

  async getPipeline(pipelineId: number): Promise<CicdPipelineDto> {
    const pipeline = await this.prismaService.cicdPipeline.findUnique({
      where: { id: pipelineId },
      include: {
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
      tags: JSON.parse(pipeline.tags as string),
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

  async getPipelinesByTag(tag: string): Promise<CicdPipelineDto[]> {
    const allPipelines = await this.prismaService.cicdPipeline.findMany({
      include: {
        cicdPipelineRuns: {
          include: {
            cicdPipelineStepMeasurements: true,
          },
        },
      },
    });

    const filteredPipelines = allPipelines.filter((pipeline) => {
      const pipelineTags = this.safeJsonParse(pipeline.tags as string, []);
      console.log(
        `Pipeline ID: ${pipeline.id}, Tags: ${JSON.stringify(pipelineTags)}`,
      );
      return pipelineTags.includes(tag);
    });

    return filteredPipelines.map((pipeline) => {
      const dto = this.mapToCicdPipelineDto(pipeline);
      return dto;
    });
  }

  private safeJsonParse(jsonString: string, defaultValue: any = null) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn(`Failed to parse JSON: ${jsonString}. Using default value.`);
      return defaultValue;
    }
  }

  private mapToCicdPipelineDto(pipeline: any): CicdPipelineDto {
    return {
      ...pipeline,
      totalCo2: this.calculateTotalCo2ForPipeline(pipeline),
      tags: this.safeJsonParse(pipeline.tags as string, []),
    };
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
