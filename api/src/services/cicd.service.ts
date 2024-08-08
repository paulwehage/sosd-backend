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
    projectId: number,
    createDto: CreateCicdPipelineDto,
  ): Promise<CicdPipelineDto> {
    const projectSdlcStep = await this.prismaService.projectSdlcStep.findFirst({
      where: { projectId, sdlcStep: { name: 'integration_deployment' } },
    });

    if (!projectSdlcStep) {
      throw new NotFoundException(
        `Integration/Deployment step not found for project ${projectId}`,
      );
    }

    const pipeline = await this.prismaService.cicdPipeline.create({
      data: {
        ...createDto,
        projectSdlcStepId: projectSdlcStep.id,
        tags: JSON.stringify(createDto.tags),
      },
    });

    return {
      ...pipeline,
      totalCo2: 0,
      tags: JSON.parse(pipeline.tags as string),
    };
  }

  async getPipelines(projectId: number): Promise<CicdPipelineDto[]> {
    const pipelines = await this.prismaService.cicdPipeline.findMany({
      where: {
        projectSdlcStep: {
          projectId,
          sdlcStep: { name: 'integration_deployment' },
        },
      },
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

  async getPipeline(
    projectId: number,
    pipelineId: number,
  ): Promise<CicdPipelineDto> {
    const pipeline = await this.prismaService.cicdPipeline.findFirst({
      where: {
        id: pipelineId,
        projectSdlcStep: {
          projectId,
          sdlcStep: { name: 'integration_deployment' },
        },
      },
      include: {
        cicdPipelineRuns: {
          include: {
            cicdPipelineStepMeasurements: true,
          },
        },
      },
    });

    if (!pipeline) {
      throw new NotFoundException(
        `Pipeline with ID ${pipelineId} not found for project ${projectId}`,
      );
    }

    return {
      ...pipeline,
      totalCo2: this.calculateTotalCo2ForPipeline(pipeline),
      tags: JSON.parse(pipeline.tags as string),
    };
  }

  async createPipelineRun(
    projectId: number,
    pipelineId: number,
    createDto: CreateCicdPipelineRunDto,
  ): Promise<CicdPipelineRunDto> {
    await this.getPipeline(projectId, pipelineId);
    const pipelineRun = await this.prismaService.cicdPipelineRun.create({
      data: {
        ...createDto,
        cicdPipelineId: pipelineId,
      },
    });

    return { ...pipelineRun, totalCo2: 0 };
  }

  async getPipelineRuns(
    projectId: number,
    pipelineId: number,
  ): Promise<CicdPipelineRunDto[]> {
    const pipelineRuns = await this.prismaService.cicdPipelineRun.findMany({
      where: {
        cicdPipeline: {
          id: pipelineId,
          projectSdlcStep: {
            projectId,
            sdlcStep: { name: 'integration_deployment' },
          },
        },
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
    projectId: number,
    pipelineId: number,
    runId: number,
    createDto: CreateCicdPipelineStepMeasurementDto,
  ): Promise<CicdPipelineStepMeasurementDto> {
    // Transform empty strings to null
    const transformedDto = {
      ...createDto,
      integrationSubStepName:
        // @ts-ignore
        createDto.integrationSubStepName === ''
          ? null
          : createDto.integrationSubStepName,
      deploymentStage:
        // @ts-ignore
        createDto.deploymentStage === '' ? null : createDto.deploymentStage,
    };

    // Validate step name
    if (!Object.values(CicdStepName).includes(transformedDto.stepName)) {
      throw new BadRequestException(
        `Invalid step name. Available options are: ${Object.values(CicdStepName).join(', ')}`,
      );
    }

    // Validate integration sub-step name if present
    if (
      transformedDto.integrationSubStepName !== null &&
      !Object.values(IntegrationSubStepName).includes(
        transformedDto.integrationSubStepName as IntegrationSubStepName,
      )
    ) {
      throw new BadRequestException(
        `Invalid integration sub-step name. Available options are: ${Object.values(IntegrationSubStepName).join(', ')}`,
      );
    }

    // Validate deployment stage if present
    if (
      transformedDto.deploymentStage !== null &&
      !Object.values(DeploymentSubStepName).includes(
        transformedDto.deploymentStage as DeploymentSubStepName,
      )
    ) {
      throw new BadRequestException(
        `Invalid deployment stage. Available options are: ${Object.values(DeploymentSubStepName).join(', ')}`,
      );
    }

    // Validate combination of step name and sub-steps
    if (transformedDto.stepName === CicdStepName.integration) {
      if (!transformedDto.integrationSubStepName) {
        throw new BadRequestException(
          'Integration step must have an integration sub-step name',
        );
      }
      if (transformedDto.deploymentStage) {
        throw new BadRequestException(
          'Integration step should not have a deployment stage',
        );
      }
    } else if (transformedDto.stepName === CicdStepName.deployment) {
      if (!transformedDto.deploymentStage) {
        throw new BadRequestException(
          'Deployment step must have a deployment stage',
        );
      }
      if (transformedDto.integrationSubStepName) {
        throw new BadRequestException(
          'Deployment step should not have an integration sub-step name',
        );
      }
    } else {
      if (
        transformedDto.integrationSubStepName ||
        transformedDto.deploymentStage
      ) {
        throw new BadRequestException(
          'Other steps should not have integration sub-step name or deployment stage',
        );
      }
    }

    const pipelineRun = await this.prismaService.cicdPipelineRun.findFirst({
      where: {
        id: runId,
        cicdPipeline: {
          id: pipelineId,
          projectSdlcStep: {
            projectId,
            sdlcStep: { name: 'integration_deployment' },
          },
        },
      },
    });

    if (!pipelineRun) {
      throw new NotFoundException(
        `Pipeline run with ID ${runId} not found for pipeline ${pipelineId} in project ${projectId}`,
      );
    }

    return this.prismaService.cicdPipelineStepMeasurement.create({
      data: {
        ...transformedDto,
        cicdPipelineRunId: runId,
      },
    });
  }

  async getStepMeasurements(
    projectId: number,
    pipelineId: number,
    runId: number,
  ): Promise<CicdPipelineStepMeasurementDto[]> {
    const pipelineRun = await this.prismaService.cicdPipelineRun.findFirst({
      where: {
        id: runId,
        cicdPipeline: {
          id: pipelineId,
          projectSdlcStep: {
            projectId,
            sdlcStep: { name: 'integration_deployment' },
          },
        },
      },
      include: {
        cicdPipelineStepMeasurements: true,
      },
    });

    if (!pipelineRun) {
      throw new NotFoundException(
        `Pipeline run with ID ${runId} not found for pipeline ${pipelineId} in project ${projectId}`,
      );
    }

    return pipelineRun.cicdPipelineStepMeasurements;
  }

  async getPipelinesByTag(
    projectId: number,
    tag: string,
  ): Promise<CicdPipelineDto[]> {
    const allPipelines = await this.prismaService.cicdPipeline.findMany({
      where: {
        projectSdlcStep: {
          projectId,
          sdlcStep: { name: 'integration_deployment' },
        },
      },
      include: {
        cicdPipelineRuns: {
          include: {
            cicdPipelineStepMeasurements: true,
          },
        },
      },
    });

    const filteredPipelines = allPipelines.filter((pipeline) => {
      const tags = this.safeJsonParse(pipeline.tags as string, []);
      return Array.isArray(tags) && tags.includes(tag);
    });

    return filteredPipelines.map((pipeline) => ({
      ...pipeline,
      totalCo2: this.calculateTotalCo2ForPipeline(pipeline),
      tags: this.safeJsonParse(pipeline.tags as string, []),
    }));
  }

  private safeJsonParse(jsonString: string, defaultValue: any = null) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      return defaultValue;
    }
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
