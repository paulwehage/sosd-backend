import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AllowedMetricDto,
  CreateInfrastructureElementDto,
  CreateMetricDefinitionDto,
  CreateMetricValueDto,
  InfrastructureElementDto,
  InfrastructureServiceDto,
  MetricDefinitionDto,
  MetricValueDto,
} from '../dtos/operations.dto';
import { DataType } from '@prisma/client';
import { PrismaService } from './prisma.service';

@Injectable()
export class OperationsService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  async getInfrastructureElements(
    projectId: number,
  ): Promise<InfrastructureElementDto[]> {
    const elements =
      await this.prismaService.operationsInfrastructureElement.findMany({
        where: {
          projectSdlcStep: {
            projectId,
            sdlcStep: { name: 'operations' },
          },
        },
        include: {
          infrastructureService: {
            include: {
              cloudProvider: true,
            },
          },
          metricValues: {
            include: {
              metricDefinition: true,
            },
          },
        },
      });

    return elements.map(this.mapToInfrastructureElementDto.bind(this));
  }

  async getInfrastructureServices(): Promise<InfrastructureServiceDto[]> {
    const services = await this.prismaService.infrastructureService.findMany({
      include: { cloudProvider: true },
    });

    // @ts-ignore
    return services.map((service) => ({
      id: service.id,
      type: service.type,
      category: service.category,
      cloudProvider: service.cloudProvider.name,
    }));
  }

  async getMetricDefinitions(): Promise<MetricDefinitionDto[]> {
    const definitions =
      await this.prismaService.operationsMetricDefinition.findMany({
        include: {
          applicableServices: {
            include: {
              service: {
                include: {
                  cloudProvider: true,
                },
              },
            },
          },
        },
      });

    // @ts-ignore
    return definitions.map((def) => ({
      id: def.id,
      name: def.metricName,
      dataType: def.dataType,
      isKeyMetric: def.isKeyMetric,
      applicableServices: def.applicableServices.map((as) => ({
        id: as.service.id,
        type: as.service.type,
        category: as.service.category,
        cloudProvider: as.service.cloudProvider.name,
      })),
    }));
  }

  async getAllowedMetrics(
    infrastructureServiceId: number,
  ): Promise<AllowedMetricDto[]> {
    const allowedMetrics = await this.prismaService.allowedMetric.findMany({
      where: { infrastructureServiceId },
      include: {
        metricDefinition: true,
        infrastructureService: true,
      },
    });

    // @ts-ignore
    return allowedMetrics.map((am) => ({
      serviceType: am.infrastructureService.type,
      serviceCategory: am.infrastructureService.category,
      metricName: am.metricDefinition.metricName,
      dataType: am.metricDefinition.dataType,
    }));
  }

  async addMetricValue(
    elementId: number,
    createDto: CreateMetricValueDto,
  ): Promise<MetricValueDto> {
    const element =
      await this.prismaService.operationsInfrastructureElement.findUnique({
        where: { id: elementId },
        include: { infrastructureService: true },
      });

    if (!element) {
      throw new NotFoundException(
        `Infrastructure element with ID ${elementId} not found`,
      );
    }

    const allowedMetric = await this.prismaService.allowedMetric.findFirst({
      where: {
        infrastructureServiceId: element.infrastructureServiceId,
        metricDefinitionId: createDto.metricDefinitionId,
      },
    });

    if (!allowedMetric) {
      throw new BadRequestException(
        'This metric is not allowed for this infrastructure service',
      );
    }

    const metricDefinition =
      await this.prismaService.operationsMetricDefinition.findUnique({
        where: { id: createDto.metricDefinitionId },
      });

    if (!metricDefinition) {
      throw new NotFoundException(
        `Metric definition with ID ${createDto.metricDefinitionId} not found`,
      );
    }

    const metricValue = await this.prismaService.operationsMetricValue.create({
      data: {
        infrastructureElementId: elementId,
        metricDefinitionId: createDto.metricDefinitionId,
        [this.getValueFieldName(metricDefinition.dataType)]: createDto.value,
        timestamp: new Date(),
      },
      include: {
        metricDefinition: true,
      },
    });

    return {
      name: metricValue.metricDefinition.metricName,
      value: this.getMetricValue(metricValue),
      dataType: metricValue.metricDefinition.dataType,
      timestamp: metricValue.timestamp,
    };
  }

  async createInfrastructureElement(
    projectId: number,
    createDto: CreateInfrastructureElementDto,
  ): Promise<InfrastructureElementDto> {
    const projectSdlcStep = await this.prismaService.projectSdlcStep.findFirst({
      where: { projectId, sdlcStep: { name: 'operations' } },
    });

    if (!projectSdlcStep) {
      throw new NotFoundException(
        `Operations step not found for project ${projectId}`,
      );
    }

    const element =
      await this.prismaService.operationsInfrastructureElement.create({
        data: {
          name: createDto.name,
          projectSdlcStepId: projectSdlcStep.id,
          infrastructureServiceId: createDto.infrastructureServiceId,
          tag: createDto.tag,
        },
        include: {
          infrastructureService: {
            include: {
              cloudProvider: true,
            },
          },
        },
      });

    return {
      id: element.id,
      name: element.name,
      type: element.infrastructureService.type,
      category: element.infrastructureService.category,
      cloudProvider: element.infrastructureService.cloudProvider.name,
      tag: element.tag,
      totalCo2: 0,
      metrics: [],
    };
  }

  async getInfrastructureElement(
    projectId: number,
    elementId: number,
  ): Promise<InfrastructureElementDto> {
    const element =
      await this.prismaService.operationsInfrastructureElement.findFirst({
        where: {
          id: elementId,
          projectSdlcStep: {
            projectId,
            sdlcStep: { name: 'operations' },
          },
        },
        include: {
          infrastructureService: {
            include: {
              cloudProvider: true,
            },
          },
          metricValues: {
            include: {
              metricDefinition: true,
            },
          },
        },
      });

    if (!element) {
      throw new NotFoundException(
        `Infrastructure element with ID ${elementId} not found for project ${projectId}`,
      );
    }

    return this.mapToInfrastructureElementDto(element);
  }

  async getInfrastructureElementsByTag(
    projectId: number,
    tag: string,
  ): Promise<InfrastructureElementDto[]> {
    const elements =
      await this.prismaService.operationsInfrastructureElement.findMany({
        where: {
          projectSdlcStep: {
            projectId,
            sdlcStep: { name: 'operations' },
          },
          tag: tag,
        },
        include: {
          infrastructureService: {
            include: {
              cloudProvider: true,
            },
          },
          metricValues: {
            include: {
              metricDefinition: true,
            },
          },
        },
      });

    return elements.map((element) => ({
      id: element.id,
      name: element.name,
      type: element.infrastructureService.type,
      category: element.infrastructureService.category,
      cloudProvider: element.infrastructureService.cloudProvider.name,
      tag: element.tag,
      totalCo2: this.calculateTotalCo2(element.metricValues),
      metrics: element.metricValues.map((mv) => ({
        name: mv.metricDefinition.metricName,
        value: this.getMetricValue(mv),
        dataType: mv.metricDefinition.dataType,
        timestamp: mv.timestamp,
      })),
    }));
  }

  async createMetricDefinition(
    createDto: CreateMetricDefinitionDto,
  ): Promise<MetricDefinitionDto> {
    if (createDto.isKeyMetric) {
      await this.validateKeyMetricsCount(createDto.applicableServiceIds);
    }

    const metricDefinition =
      await this.prismaService.operationsMetricDefinition.create({
        data: {
          metricName: createDto.name,
          dataType: createDto.dataType,
          isKeyMetric: createDto.isKeyMetric,
          applicableServices: {
            create: createDto.applicableServiceIds.map((serviceId) => ({
              serviceId: serviceId,
            })),
          },
        },
        include: {
          applicableServices: {
            include: {
              service: true,
            },
          },
        },
      });

    return this.mapToDto(metricDefinition);
  }

  private calculateTotalCo2(metricValues: any[]): number {
    return metricValues
      .filter((mv) => mv.metricDefinition.metricName === 'co2_consumption')
      .reduce((total, mv) => total + (mv.valueDecimal || 0), 0);
  }

  private getMetricValue(metricValue: any): number | string {
    if (metricValue.valueInt !== null) return metricValue.valueInt;
    if (metricValue.valueDecimal !== null) return metricValue.valueDecimal;
    if (metricValue.valueString !== null) return metricValue.valueString;
    throw new Error('No value found for metric');
  }

  private getValueFieldName(dataType: DataType): string {
    switch (dataType) {
      case DataType.integer:
        return 'valueInt';
      case DataType.decimal:
        return 'valueDecimal';
      case DataType.string:
        return 'valueString';
      default:
        throw new BadRequestException(`Invalid data type: ${dataType}`);
    }
  }

  private async validateKeyMetricsCount(serviceIds: number[]): Promise<void> {
    for (const serviceId of serviceIds) {
      const keyMetricsCount =
        await this.prismaService.operationsMetricDefinition.count({
          where: {
            applicableServices: {
              some: {
                serviceId: serviceId,
              },
            },
            isKeyMetric: true,
          },
        });

      if (keyMetricsCount >= 3) {
        throw new BadRequestException(
          `Service with ID ${serviceId} already has 3 key metrics. Cannot add more key metrics.`,
        );
      }
    }
  }

  private mapToDto(metricDefinition: any): MetricDefinitionDto {
    return {
      id: metricDefinition.id,
      name: metricDefinition.metricName,
      dataType: metricDefinition.dataType,
      isKeyMetric: metricDefinition.isKeyMetric,
      applicableServices: metricDefinition.applicableServices.map(
        (as: { service: { id: any; type: any; category: any } }) => ({
          id: as.service.id,
          type: as.service.type,
          category: as.service.category,
        }),
      ),
    };
  }

  private mapToInfrastructureElementDto(
    element: any,
  ): InfrastructureElementDto {
    return {
      id: element.id,
      name: element.name,
      type: element.infrastructureService.type,
      category: element.infrastructureService.category,
      cloudProvider: element.infrastructureService.cloudProvider.name,
      tag: element.tag,
      totalCo2: this.calculateTotalCo2(element.metricValues),
      metrics: element.metricValues.map((mv) => ({
        name: mv.metricDefinition.metricName,
        value: this.getMetricValue(mv),
        dataType: mv.metricDefinition.dataType,
        timestamp: mv.timestamp,
      })),
    };
  }
}
