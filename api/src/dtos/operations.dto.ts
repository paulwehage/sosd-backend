import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { InfrastructureElementCategory, DataType } from '@prisma/client';

export class MetricValueDto {
  @ApiProperty({ description: 'Name of the metric' })
  name: string;

  @ApiProperty({ description: 'Value of the metric' })
  value: number | string;

  @ApiProperty({ description: 'Data type of the metric', enum: DataType })
  dataType: DataType;

  @ApiProperty({ description: 'Timestamp of the metric value' })
  timestamp: Date;
}

export class KeyMetricsDto {
  @ApiProperty({ description: 'Daily CO2 Consumption in grams' })
  dailyCo2Consumption: number;

  @ApiProperty({ description: 'First key metric (varies by service)' })
  keyMetric1: MetricValueDto;

  @ApiProperty({ description: 'Second key metric (varies by service)' })
  keyMetric2: MetricValueDto;
}

export class InfrastructureElementDto {
  @ApiProperty({
    description: 'Unique identifier of the infrastructure element',
  })
  id: number;

  @ApiProperty({
    description: 'Name of the specific infrastructure element instance',
  })
  name: string;

  @ApiProperty({ description: 'Type of the infrastructure service' })
  type: string;

  @ApiProperty({
    description: 'Category of the infrastructure element',
    enum: InfrastructureElementCategory,
  })
  category: InfrastructureElementCategory;

  @ApiProperty({ description: 'Name of the cloud provider' })
  cloudProvider: string;

  @ApiProperty({ description: 'Tags for the infrastructure element' })
  tags: string[];

  @ApiProperty({
    description: 'Total CO2 consumption of the infrastructure element',
  })
  totalCo2: number;

  @ApiProperty({
    description: 'Key metrics of the infrastructure element',
    type: KeyMetricsDto,
  })
  keyMetrics: KeyMetricsDto;
}

export class DetailedInfrastructureElementDto extends InfrastructureElementDto {
  @ApiProperty({
    description: 'All metrics associated with the infrastructure element',
    type: [MetricValueDto],
  })
  metrics: MetricValueDto[];
}

export class CreateMetricValueDto {
  @ApiProperty({ description: 'ID of the metric definition' })
  @IsNumber()
  @IsNotEmpty()
  metricDefinitionId: number;

  @ApiProperty({ description: 'Value of the metric (can be number or string)' })
  @IsNotEmpty()
  value: number | string;
}

export class InfrastructureServiceDto {
  @ApiProperty({
    description: 'Unique identifier of the infrastructure service',
  })
  id: number;

  @ApiProperty({
    description: 'Category of the infrastructure service',
    enum: InfrastructureElementCategory,
  })
  category: string;

  @ApiProperty({ description: 'Type of the infrastructure element' })
  type: string;

  @ApiProperty({ description: 'Name of the cloud provider' })
  cloudProvider: string;
}

export class AllowedMetricDto {
  @ApiProperty({ description: 'Name of the infrastructure service' })
  serviceName: string;

  @ApiProperty({
    description: 'Type of the infrastructure element',
    enum: InfrastructureElementCategory,
  })
  serviceType: InfrastructureElementCategory;

  @ApiProperty({ description: 'Name of the metric' })
  metricName: string;

  @ApiProperty({ description: 'Data type of the metric', enum: DataType })
  dataType: DataType;
}

export class CreateInfrastructureElementDto {
  @ApiProperty({
    description: 'Name of the specific infrastructure element instance',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'ID of the infrastructure service' })
  @IsNumber()
  @IsNotEmpty()
  infrastructureServiceId: number;

  @ApiProperty({ description: 'Tags for the infrastructure element' })
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}

export class CreateMetricDefinitionDto {
  @ApiProperty({ description: 'Name of the metric' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Data type of the metric', enum: DataType })
  @IsEnum(DataType)
  dataType: DataType;

  @ApiProperty({
    description: 'IDs of applicable infrastructure services',
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  applicableServiceIds: number[];

  @ApiProperty({
    description: 'Whether this is a key metric to be displayed prominently',
  })
  @IsBoolean()
  isKeyMetric: boolean;
}

export class MetricDefinitionDto {
  @ApiProperty({ description: 'Unique identifier of the metric definition' })
  id: number;

  @ApiProperty({ description: 'Name of the metric' })
  name: string;

  @ApiProperty({ description: 'Data type of the metric', enum: DataType })
  dataType: DataType;

  @ApiProperty({ description: 'Whether this is a key metric' })
  isKeyMetric: boolean;

  @ApiProperty({
    description: 'Applicable services for this metric',
    type: [InfrastructureServiceDto],
  })
  applicableServices: InfrastructureServiceDto[];
}

export class CreateInfrastructureServiceDto {
  @ApiProperty({ description: 'Type of the infrastructure service' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'Category of the infrastructure service',
    enum: InfrastructureElementCategory,
  })
  @IsEnum(InfrastructureElementCategory)
  @IsNotEmpty()
  category: InfrastructureElementCategory;

  @ApiProperty({ description: 'Name of the cloud provider' })
  @IsString()
  @IsNotEmpty()
  cloudProvider: string;
}
