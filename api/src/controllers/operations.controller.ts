import {
  Body,
  Controller,
  Get,
  Param,
  ParseArrayPipe,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OperationsService } from '../services/operations.service';
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

@ApiTags('Operations')
@Controller('/operations')
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Post('infrastructure-elements')
  @ApiOperation({ summary: 'Create a new infrastructure element' })
  @ApiResponse({
    status: 201,
    description: 'The infrastructure element has been successfully created.',
    type: InfrastructureElementDto,
  })
  async createInfrastructureElement(
    @Body() createDto: CreateInfrastructureElementDto,
  ): Promise<InfrastructureElementDto> {
    return this.operationsService.createInfrastructureElement(createDto);
  }

  @Get('infrastructure-elements')
  @ApiOperation({ summary: 'Get infrastructure elements filtered by tags' })
  @ApiResponse({
    status: 200,
    description: 'Return infrastructure elements filtered by tags.',
    type: [InfrastructureElementDto],
  })
  @ApiQuery({ name: 'tags', required: true, type: [String], isArray: true })
  @ApiQuery({ name: 'matchAll', required: false, type: Boolean })
  async getInfrastructureElementsByTags(
    @Query('tags', new ParseArrayPipe({ items: String, separator: ',' }))
    tags: string[],
    @Query('matchAll', new ParseBoolPipe({ optional: true }))
    matchAll: boolean = false,
  ): Promise<InfrastructureElementDto[]> {
    return await this.operationsService.getInfrastructureElementsByTags(
      tags,
      matchAll,
    );
  }

  @Get('infrastructure-elements/:elementId')
  @ApiOperation({ summary: 'Get a specific infrastructure element' })
  @ApiResponse({
    status: 200,
    description: 'Return the infrastructure element.',
    type: InfrastructureElementDto,
  })
  @ApiParam({ name: 'elementId', type: 'number' })
  async getInfrastructureElement(
    @Param('elementId', ParseIntPipe) elementId: number,
  ): Promise<InfrastructureElementDto> {
    return this.operationsService.getInfrastructureElement(elementId);
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
