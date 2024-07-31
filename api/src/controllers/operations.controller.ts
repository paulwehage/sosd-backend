import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { OperationsService } from '../services/operations.service';
import {
  AllowedMetricDto,
  InfrastructureElementDto,
  InfrastructureServiceDto,
  MetricDefinitionDto,
  MetricValueDto,
  CreateInfrastructureElementDto,
  CreateMetricDefinitionDto,
  CreateMetricValueDto,
} from '../dtos/operations.dto';

@ApiTags('Operations')
@Controller('projects/:projectId/sdlc/operations')
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Post('infrastructure-elements')
  @ApiOperation({ summary: 'Create a new infrastructure element' })
  @ApiResponse({
    status: 201,
    description: 'The infrastructure element has been successfully created.',
    type: InfrastructureElementDto,
  })
  @ApiParam({ name: 'projectId', type: 'number' })
  async createInfrastructureElement(
    @Param('projectId') projectId: string,
    @Body() createDto: CreateInfrastructureElementDto,
  ): Promise<InfrastructureElementDto> {
    return this.operationsService.createInfrastructureElement(
      +projectId,
      createDto,
    );
  }

  @Get('infrastructure-elements')
  @ApiOperation({ summary: 'Get all infrastructure elements for a project' })
  @ApiResponse({
    status: 200,
    description: 'Return all infrastructure elements.',
    type: [InfrastructureElementDto],
  })
  @ApiParam({ name: 'projectId', type: 'number' })
  async getInfrastructureElements(
    @Param('projectId') projectId: string,
  ): Promise<InfrastructureElementDto[]> {
    return this.operationsService.getInfrastructureElements(+projectId);
  }

  @Get('infrastructure-elements/:elementId')
  @ApiOperation({ summary: 'Get a specific infrastructure element' })
  @ApiResponse({
    status: 200,
    description: 'Return the infrastructure element.',
    type: InfrastructureElementDto,
  })
  @ApiParam({ name: 'projectId', type: 'number' })
  @ApiParam({ name: 'elementId', type: 'number' })
  async getInfrastructureElement(
    @Param('projectId') projectId: string,
    @Param('elementId') elementId: string,
  ): Promise<InfrastructureElementDto> {
    return this.operationsService.getInfrastructureElement(
      +projectId,
      +elementId,
    );
  }

  @Post('infrastructure-elements/:elementId/metric-values')
  @ApiOperation({
    summary: 'Add a new metric value to an infrastructure element',
  })
  @ApiResponse({
    status: 201,
    description: 'The metric value has been successfully added.',
    type: MetricValueDto,
  })
  @ApiParam({ name: 'projectId', type: 'number' })
  @ApiParam({ name: 'elementId', type: 'number' })
  async addMetricValue(
    @Param('elementId', ParseIntPipe) elementId: number,
    @Body() createDto: CreateMetricValueDto,
  ): Promise<MetricValueDto> {
    return this.operationsService.addMetricValue(elementId, createDto);
  }

  @Get('metric-definitions')
  @ApiOperation({ summary: 'Get all metric definitions' })
  @ApiResponse({
    status: 200,
    description: 'Return all metric definitions.',
    type: [MetricDefinitionDto],
  })
  async getMetricDefinitions(): Promise<MetricDefinitionDto[]> {
    return this.operationsService.getMetricDefinitions();
  }

  @Post('metric-definitions')
  @ApiOperation({ summary: 'Create a new metric definition' })
  @ApiResponse({
    status: 201,
    description: 'The metric definition has been successfully created.',
    type: MetricDefinitionDto,
  })
  async createMetricDefinition(
    @Body() createDto: CreateMetricDefinitionDto,
  ): Promise<MetricDefinitionDto> {
    return this.operationsService.createMetricDefinition(createDto);
  }

  @Get('allowed-metrics/:infrastructureServiceId')
  @ApiOperation({
    summary: 'Get allowed metrics for a specific infrastructure service',
  })
  @ApiResponse({
    status: 200,
    description: 'Return the allowed metrics.',
    type: [AllowedMetricDto],
  })
  @ApiParam({ name: 'infrastructureServiceId', type: 'number' })
  async getAllowedMetrics(
    @Param('infrastructureServiceId', ParseIntPipe)
    infrastructureServiceId: number,
  ): Promise<AllowedMetricDto[]> {
    return this.operationsService.getAllowedMetrics(infrastructureServiceId);
  }

  @Get('infrastructure-services')
  @ApiOperation({ summary: 'Get all infrastructure services' })
  @ApiResponse({
    status: 200,
    description: 'Return all infrastructure services.',
    type: [InfrastructureServiceDto],
  })
  async getInfrastructureServices(): Promise<InfrastructureServiceDto[]> {
    return this.operationsService.getInfrastructureServices();
  }
}
