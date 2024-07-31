import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { InfrastructureElementType, DataType } from '@prisma/client';

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

export class InfrastructureElementDto {
  @ApiProperty({
    description: 'Unique identifier of the infrastructure element',
  })
  id: number;

  @ApiProperty({ description: 'Name of the infrastructure service' })
  name: string;

  @ApiProperty({
    description: 'Type of the infrastructure element',
    enum: InfrastructureElementType,
  })
  type: InfrastructureElementType;

  @ApiProperty({ description: 'Name of the cloud provider' })
  cloudProvider: string;

  @ApiProperty({ description: 'Tag of the infrastructure element' })
  tag: string;

  @ApiProperty({
    description: 'Total CO2 consumption of the infrastructure element',
  })
  totalCo2: number;

  @ApiProperty({
    description: 'Metrics associated with the infrastructure element',
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

  @ApiProperty({ description: 'Name of the infrastructure service' })
  name: string;

  @ApiProperty({
    description: 'Type of the infrastructure element',
    enum: InfrastructureElementType,
  })
  type: InfrastructureElementType;

  @ApiProperty({ description: 'Name of the cloud provider' })
  cloudProvider: string;
}

export class AllowedMetricDto {
  @ApiProperty({ description: 'Name of the infrastructure service' })
  serviceName: string;

  @ApiProperty({
    description: 'Type of the infrastructure element',
    enum: InfrastructureElementType,
  })
  serviceType: InfrastructureElementType;

  @ApiProperty({ description: 'Name of the metric' })
  metricName: string;

  @ApiProperty({ description: 'Data type of the metric', enum: DataType })
  dataType: DataType;
}

export class CreateInfrastructureElementDto {
  @ApiProperty({ description: 'ID of the infrastructure service' })
  @IsNumber()
  @IsNotEmpty()
  infrastructureServiceId: number;

  @ApiProperty({ description: 'Tag of the infrastructure element' })
  @IsString()
  @IsNotEmpty()
  tag: string;
}

export class CreateMetricDefinitionDto {
  @ApiProperty({ description: 'Name of the metric' })
  @IsString()
  metricName: string;

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
  applicableServices: InfrastructureServiceDto[];
}

export class UpdateMetricDefinitionDto {
  @ApiProperty({ description: 'Name of the metric', required: false })
  @IsString()
  metricName?: string;

  @ApiProperty({
    description: 'Data type of the metric',
    enum: DataType,
    required: false,
  })
  @IsEnum(DataType)
  dataType?: DataType;

  @ApiProperty({
    description: 'IDs of applicable infrastructure services',
    type: [Number],
    required: false,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  applicableServiceIds?: number[];

  @ApiProperty({
    description: 'Whether this is a key metric to be displayed prominently',
    required: false,
  })
  @IsBoolean()
  isKeyMetric?: boolean;
}
