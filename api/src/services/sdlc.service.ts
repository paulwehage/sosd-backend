import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { SdlcStepName, SdlcStep } from '@prisma/client';
import { PrismaService } from './prisma.service';

@Injectable()
export class SdlcService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  async getProjectSdlcOverview(projectId: number) {
    const steps = await this.prismaService.sdlcStep.findMany({
      include: {
        projectSdlcSteps: {
          where: { projectId },
          include: {
            cicdPipelines: {
              include: {
                cicdPipelineRuns: {
                  include: {
                    cicdPipelineStepMeasurements: true,
                  },
                },
              },
            },
            operationsInfrastructureElements: {
              include: {
                metricValues: {
                  where: {
                    metricDefinition: {
                      metricName: 'co2_consumption',
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    let totalCo2 = 0;
    const stepsWithCo2 = steps.map((step) => {
      let stepTotalCo2 = 0;

      // Sum CO2 from CICD pipelines
      step.projectSdlcSteps.forEach((projectStep) => {
        projectStep.cicdPipelines.forEach((pipeline) => {
          pipeline.cicdPipelineRuns.forEach((run) => {
            run.cicdPipelineStepMeasurements.forEach((measurement) => {
              stepTotalCo2 += measurement.co2Consumption;
            });
          });
        });
      });

      // Sum CO2 from operations infrastructure elements
      step.projectSdlcSteps.forEach((projectStep) => {
        projectStep.operationsInfrastructureElements.forEach((element) => {
          element.metricValues.forEach((metricValue) => {
            if (metricValue.valueDecimal) {
              stepTotalCo2 += metricValue.valueDecimal;
            }
          });
        });
      });

      totalCo2 += stepTotalCo2;

      return {
        id: step.id,
        name: step.name,
        totalCo2: stepTotalCo2,
      };
    });

    return {
      projectId,
      totalCo2,
      steps: stepsWithCo2,
      message: 'SDLC overview with CO2 consumption',
    };
  }

  async getStepInfo(projectId: number, stepName: SdlcStepName) {
    const step = await this.prismaService.sdlcStep.findFirst({
      where: { name: stepName },
    });

    if (!step) {
      throw new NotFoundException(`Step ${stepName} not found`);
    }

    switch (stepName) {
      case SdlcStepName.operations:
        return this.getOperationsInfo(projectId, step);
      // Weitere Cases für andere Schritte...
      default:
        return { projectId, step, message: 'Step info to be implemented' };
    }
  }

  private async getOperationsInfo(projectId: number, step: SdlcStep) {
    const elementCount =
      await this.prismaService.operationsInfrastructureElement.count({
        where: {
          projectSdlcStep: {
            projectId,
            sdlcStepId: step.id,
          },
        },
      });

    const totalCo2 = await this.prismaService.operationsMetricValue.aggregate({
      _sum: {
        valueDecimal: true,
      },
      where: {
        infrastructureElement: {
          projectSdlcStep: {
            projectId,
            sdlcStepId: step.id,
          },
        },
        metricDefinition: {
          metricName: 'co2_consumption',
        },
      },
    });

    return {
      step,
      elementCount,
      totalCo2: totalCo2._sum.valueDecimal || 0,
      message: 'Operations info with CO2 consumption',
    };
  }
}
