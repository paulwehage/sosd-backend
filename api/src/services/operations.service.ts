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
  UpdateMetricDefinitionDto,
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

    return elements.map((element) => ({
      id: element.id,
      name: element.infrastructureService.name,
      type: element.infrastructureService.type,
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

  async getInfrastructureServices(): Promise<InfrastructureServiceDto[]> {
    const services = await this.prismaService.infrastructureService.findMany({
      include: { cloudProvider: true },
    });

    return services.map((service) => ({
      id: service.id,
      name: service.name,
      type: service.type,
      cloudProvider: service.cloudProvider.name,
    }));
  }

  async getMetricDefinitions(): Promise<
    {
      dataType: 'integer' | 'decimal' | 'string';
      name: string;
      id: number;
      isKeyMetric: boolean;
      applicableServices: any;
    }[]
  > {
    const definitions =
      await this.prismaService.operationsMetricDefinition.findMany({
        include: {
          allowedMetrics: {
            include: {
              infrastructureService: true,
            },
          },
        },
      });

    return definitions.map((def) => ({
      id: def.id,
      name: def.metricName,
      dataType: def.dataType,
      isKeyMetric: def.isKeyMetric,
      applicableServices: def.allowedMetrics.map((am) => ({
        id: am.infrastructureService.id,
        name: am.infrastructureService.name,
        type: am.infrastructureService.type,
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

    return allowedMetrics.map((am) => ({
      serviceName: am.infrastructureService.name,
      serviceType: am.infrastructureService.type,
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
        infrastructureServiceId: element.infrastructureService.id,
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
      name: element.infrastructureService.name,
      type: element.infrastructureService.type,
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

    return {
      id: element.id,
      name: element.infrastructureService.name,
      type: element.infrastructureService.type,
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

  async createMetricDefinition(
    createDto: CreateMetricDefinitionDto,
  ): Promise<MetricDefinitionDto> {
    if (createDto.isKeyMetric) {
      await this.validateKeyMetricsCount(createDto.applicableServiceIds);
    }

    const metricDefinition =
      await this.prismaService.operationsMetricDefinition.create({
        data: {
          metricName: createDto.metricName,
          dataType: createDto.dataType,
          isKeyMetric: createDto.isKeyMetric,
          applicableServices: {
            create: createDto.applicableServiceIds.map((serviceId) => ({
              serviceId: serviceId,
            })),
          },
        },
        include: {
          applicableServices: true,
        },
      });

    return this.mapToDto(metricDefinition);
  }

  async updateMetricDefinition(
    id: number,
    updateDto: UpdateMetricDefinitionDto,
  ): Promise<MetricDefinitionDto> {
    if (updateDto.isKeyMetric !== undefined) {
      const currentMetric =
        await this.prismaService.operationsMetricDefinition.findUnique({
          where: { id },
          include: { applicableServices: true },
        });
      if (updateDto.isKeyMetric && !currentMetric.isKeyMetric) {
        await this.validateKeyMetricsCount(
          updateDto.applicableServiceIds ||
            currentMetric.applicableServices.map((as) => as.serviceId),
        );
      }
    }

    const metricDefinition =
      await this.prismaService.operationsMetricDefinition.update({
        where: { id },
        data: {
          metricName: updateDto.metricName,
          dataType: updateDto.dataType,
          isKeyMetric: updateDto.isKeyMetric,
          applicableServices: updateDto.applicableServiceIds
            ? {
                deleteMany: {},
                create: updateDto.applicableServiceIds.map((serviceId) => ({
                  serviceId: serviceId,
                })),
              }
            : undefined,
        },
        include: {
          applicableServices: true,
        },
      });

    return this.mapToDto(metricDefinition);
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
      applicableServices: metricDefinition.applicableServices,
      id: metricDefinition.id,
      name: metricDefinition.metricName,
      dataType: metricDefinition.dataType,
      isKeyMetric: metricDefinition.isKeyMetric,
    };
  }
}
