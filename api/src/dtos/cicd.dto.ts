import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsEnum,
  IsDate,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import {
  CicdStepName,
  DeploymentSubStepName,
  IntegrationSubStepName,
} from '@prisma/client';
import { Type } from 'class-transformer';

export class KeyMetricsDto {
  @ApiProperty({ description: 'Weekly CO2 consumption of the pipeline' })
  @IsNumber()
  @IsNotEmpty()
  weekly_co2_consumption: number;

  @ApiProperty({ description: 'Integration consumption of the last run' })
  @IsNumber()
  @IsNotEmpty()
  integration_consumption_last_run: number;

  @ApiProperty({ description: 'Deployment consumption of the last run' })
  @IsNumber()
  @IsNotEmpty()
  deployment_consumption_last_run: number;
}

export class CicdPipelineDto {
  @ApiProperty({ description: 'Unique identifier of the CICD pipeline' })
  id: number;

  @ApiProperty({ description: 'Name of the repository' })
  repoName: string;

  @ApiProperty({ description: 'Branch name' })
  branch: string;

  @ApiProperty({ description: 'Cloud provider' })
  cloudProvider: string;

  @ApiProperty({ description: 'Name of the pipeline' })
  pipelineName: string;

  @ApiProperty({ description: 'Total CO2 consumption of the pipeline' })
  totalCo2: number;

  @ApiProperty({ description: 'Tags for the CI/CD pipeline' })
  tags: string[];

  @ApiProperty({ description: 'Key metrics for the pipeline' })
  @ValidateNested()
  @Type(() => KeyMetricsDto)
  keyMetrics?: KeyMetricsDto;
}

export class CreateCicdPipelineDto {
  @ApiProperty({ description: 'Name of the repository' })
  @IsString()
  @IsNotEmpty()
  repoName: string;

  @ApiProperty({ description: 'Branch name' })
  @IsString()
  @IsNotEmpty()
  branch: string;

  @ApiProperty({ description: 'Cloud provider' })
  @IsString()
  @IsNotEmpty()
  cloudProvider: string;

  @ApiProperty({ description: 'Name of the pipeline' })
  @IsString()
  @IsNotEmpty()
  pipelineName: string;

  @ApiProperty({ description: 'Tags for the CI/CD pipeline' })
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}

export class CicdPipelineRunDto {
  @ApiProperty({ description: 'Unique identifier of the pipeline run' })
  id: number;

  @ApiProperty({ description: 'Run number' })
  runNumber: number;

  @ApiProperty({ description: 'Start time of the run' })
  startTime: Date;

  @ApiProperty({ description: 'End time of the run' })
  endTime: Date;

  @ApiProperty({ description: 'Total CO2 consumption of the run' })
  totalCo2: number;
}

export class CreateCicdPipelineRunDto {
  @ApiProperty({ description: 'Run number' })
  @IsNumber()
  @IsNotEmpty()
  runNumber: number;

  @ApiProperty({ description: 'Start time of the run' })
  @IsDate()
  @IsNotEmpty()
  startTime: Date;

  @ApiProperty({ description: 'End time of the run' })
  @IsDate()
  @IsNotEmpty()
  endTime: Date;
}

export class CicdPipelineStepMeasurementDto {
  @ApiProperty({ description: 'Unique identifier of the step measurement' })
  id: number;

  @ApiProperty({ description: 'Name of the step', enum: CicdStepName })
  stepName: CicdStepName;

  @ApiProperty({
    description: 'Name of the integration sub-step',
    enum: IntegrationSubStepName,
    required: false,
  })
  integrationSubStepName?: IntegrationSubStepName;

  @ApiProperty({
    description: 'Deployment stage',
    enum: DeploymentSubStepName,
    required: false,
  })
  deploymentStage?: DeploymentSubStepName;

  @ApiProperty({ description: 'Duration of the step in seconds' })
  duration: number;

  @ApiProperty({ description: 'CO2 consumption of the step' })
  co2Consumption: number;
}

export class CreateCicdPipelineStepMeasurementDto {
  @ApiProperty({ description: 'Name of the step', enum: CicdStepName })
  @IsEnum(CicdStepName)
  @IsNotEmpty()
  stepName: CicdStepName;

  @ApiProperty({
    description: 'Name of the integration sub-step',
    enum: IntegrationSubStepName,
    required: false,
  })
  @IsEnum(IntegrationSubStepName)
  @IsOptional()
  integrationSubStepName?: IntegrationSubStepName;

  @ApiProperty({
    description: 'Deployment stage',
    enum: DeploymentSubStepName,
    required: false,
  })
  @IsEnum(DeploymentSubStepName)
  @IsOptional()
  deploymentStage?: DeploymentSubStepName;

  @ApiProperty({ description: 'Duration of the step in seconds' })
  @IsNumber()
  @IsNotEmpty()
  duration: number;

  @ApiProperty({ description: 'CO2 consumption of the step' })
  @IsNumber()
  @IsNotEmpty()
  co2Consumption: number;
}
