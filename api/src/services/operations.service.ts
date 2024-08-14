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
  DetailedInfrastructureElementDto,
  InfrastructureElementDto,
  InfrastructureServiceDto,
  KeyMetricsDto,
  MetricDefinitionDto,
  MetricValueDto,
} from '../dtos/operations.dto';
import { DataType } from '@prisma/client';
import { PrismaService } from './prisma.service';

interface MetricValue {
  metricDefinition: {
    metricName: string;
    dataType: DataType;
    isKeyMetric: boolean;
  };
  valueInt: number | null;
  valueDecimal: number | null;
  valueString: string | null;
  timestamp: Date;
}

@Injectable()
export class OperationsService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  async getInfrastructureServices(): Promise<InfrastructureServiceDto[]> {
    const services = await this.prismaService.infrastructureService.findMany({
      include: { cloudProvider: true },
    });

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

    return definitions.map(this.mapToMetricDefinitionDto);
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
    createDto: CreateInfrastructureElementDto,
  ): Promise<InfrastructureElementDto> {
    const element =
      await this.prismaService.operationsInfrastructureElement.create({
        data: {
          name: createDto.name,
          infrastructureServiceId: createDto.infrastructureServiceId,
          tags: {
            connectOrCreate: createDto.tags.map((tag) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          },
        },
        include: {
          infrastructureService: {
            include: {
              cloudProvider: true,
            },
          },
          tags: true,
        },
      });

    return this.mapToInfrastructureElementDto(element);
  }

  async getInfrastructureElement(
    elementId: number,
  ): Promise<DetailedInfrastructureElementDto> {
    const element =
      await this.prismaService.operationsInfrastructureElement.findUnique({
        where: { id: elementId },
        include: {
          infrastructureService: {
            include: {
              cloudProvider: true,
            },
          },
          tags: true,
          metricValues: {
            include: {
              metricDefinition: true,
            },
          },
          consumptions: {
            orderBy: { date: 'desc' },
            take: 1,
          },
        },
      });

    if (!element) {
      throw new NotFoundException(
        `Infrastructure element with ID ${elementId} not found`,
      );
    }

    return this.mapToDetailedInfrastructureElementDto(element);
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

    return this.mapToMetricDefinitionDto(metricDefinition);
  }

  async getInfrastructureElementsByTags(
    tags: string[],
    matchAll: boolean = false,
  ): Promise<InfrastructureElementDto[]> {
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

    const elements =
      await this.prismaService.operationsInfrastructureElement.findMany({
        where: whereCondition,
        include: {
          infrastructureService: {
            include: {
              cloudProvider: true,
            },
          },
          tags: true,
          metricValues: {
            include: {
              metricDefinition: true,
            },
          },
          consumptions: {
            orderBy: { date: 'desc' },
            take: 1,
          },
        },
      });

    return elements.map(this.mapToInfrastructureElementDto.bind(this));
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

  private mapToMetricDefinitionDto(metricDefinition: any): MetricDefinitionDto {
    return {
      id: metricDefinition.id,
      name: metricDefinition.metricName,
      dataType: metricDefinition.dataType,
      isKeyMetric: metricDefinition.isKeyMetric,
      applicableServices: metricDefinition.applicableServices.map(
        (as: {
          service: {
            id: any;
            type: any;
            category: any;
            cloudProvider: { name: any };
          };
        }) => ({
          id: as.service.id,
          type: as.service.type,
          category: as.service.category,
          cloudProvider: as.service.cloudProvider.name,
        }),
      ),
    };
  }

  private mapToInfrastructureElementDto(
    element: any,
  ): InfrastructureElementDto {
    const latestConsumption = element.consumptions[0];
    const keyMetrics = this.getKeyMetrics(
      element.metricValues,
      latestConsumption,
    );

    return {
      id: element.id,
      name: element.name,
      type: element.infrastructureService.type,
      category: element.infrastructureService.category,
      cloudProvider: element.infrastructureService.cloudProvider.name,
      tags: element.tags.map((tag: { name: any }) => tag.name),
      totalCo2: latestConsumption ? latestConsumption.co2Consumption : 0,
      keyMetrics,
    };
  }

  private mapToDetailedInfrastructureElementDto(
    element: any,
  ): DetailedInfrastructureElementDto {
    const baseDto = this.mapToInfrastructureElementDto(element);

    const latestMetrics = element.metricValues.reduce(
      (acc: Map<string, MetricValue>, mv: MetricValue) => {
        const existingMetric = acc.get(mv.metricDefinition.metricName);
        if (!existingMetric || mv.timestamp > existingMetric.timestamp) {
          acc.set(mv.metricDefinition.metricName, mv);
        }
        return acc;
      },
      new Map<string, MetricValue>(),
    );

    const distinctMetrics = Array.from(latestMetrics.values()).map(
      (mv: MetricValue) => ({
        name: mv.metricDefinition.metricName,
        value: this.getMetricValue(mv),
        dataType: mv.metricDefinition.dataType,
        timestamp: mv.timestamp,
      }),
    );

    return {
      ...baseDto,
      metrics: distinctMetrics,
    };
  }

  private getKeyMetrics(
    metricValues: MetricValue[],
    latestConsumption: any,
  ): KeyMetricsDto {
    const latestMetrics = metricValues.reduce((acc, mv) => {
      const existingMetric = acc.get(mv.metricDefinition.metricName);
      if (!existingMetric || mv.timestamp > existingMetric.timestamp) {
        acc.set(mv.metricDefinition.metricName, mv);
      }
      return acc;
    }, new Map<string, MetricValue>());

    const keyMetrics = Array.from(latestMetrics.values())
      .filter((mv) => mv.metricDefinition.isKeyMetric)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 2);

    return {
      dailyCo2Consumption: latestConsumption
        ? latestConsumption.co2Consumption
        : 0,
      keyMetric1: keyMetrics[0]
        ? {
            name: keyMetrics[0].metricDefinition.metricName,
            value: this.getMetricValue(keyMetrics[0]),
            dataType: keyMetrics[0].metricDefinition.dataType,
            timestamp: keyMetrics[0].timestamp,
          }
        : null,
      keyMetric2: keyMetrics[1]
        ? {
            name: keyMetrics[1].metricDefinition.metricName,
            value: this.getMetricValue(keyMetrics[1]),
            dataType: keyMetrics[1].metricDefinition.dataType,
            timestamp: keyMetrics[1].timestamp,
          }
        : null,
    };
  }

  private safeJsonParse(jsonString: string, defaultValue: any = null) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn(`Failed to parse JSON: ${jsonString}. Using default value.`);
      return defaultValue;
    }
  }
}
