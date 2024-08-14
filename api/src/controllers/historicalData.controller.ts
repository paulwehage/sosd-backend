import { Controller, Get, Query, ParseArrayPipe, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { HistoricalDataService } from '../services/historicalData.service';

@ApiTags('Historical Data')
@Controller('historical-data')
export class HistoricalDataController {
  constructor(private readonly historicalDataService: HistoricalDataService) {}

  @Get('cross-project')
  @ApiOperation({ summary: 'Get historical data across all projects' })
  @ApiResponse({
    status: 200,
    description: 'Historical data retrieved successfully.',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date in ISO-8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'End date in ISO-8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
  })
  async getCrossProjectHistoricalData(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.historicalDataService.getCrossProjectHistoricalData(
      startDate,
      endDate,
    );
  }

  @Get('projects/sdlc')
  @ApiOperation({ summary: 'Get historical data for SDLC steps of projects' })
  @ApiResponse({
    status: 200,
    description: 'Historical data retrieved successfully.',
  })
  @ApiQuery({ name: 'tags', required: true, type: [String] })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date in ISO-8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'End date in ISO-8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
  })
  async getProjectSdlcHistoricalData(
    @Query('tags', new ParseArrayPipe({ items: String, separator: ',' }))
    tags: string[],
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.historicalDataService.getProjectSdlcHistoricalData(
      tags,
      startDate,
      endDate,
    );
  }

  @Get('projects/operations')
  @ApiOperation({ summary: 'Get historical data for operations of projects' })
  @ApiResponse({
    status: 200,
    description: 'Historical data retrieved successfully.',
  })
  @ApiQuery({ name: 'tags', required: true, type: [String] })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date in ISO-8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'End date in ISO-8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
  })
  async getOperationsHistoricalData(
    @Query('tags', new ParseArrayPipe({ items: String, separator: ',' }))
    tags: string[],
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.historicalDataService.getProjectSdlcHistoricalData(
      tags,
      startDate,
      endDate,
    );
  }

  @Get('projects/cicd')
  @ApiOperation({ summary: 'Get historical data for CICD of projects' })
  @ApiResponse({
    status: 200,
    description: 'Historical data retrieved successfully.',
  })
  @ApiQuery({ name: 'tags', required: true, type: [String] })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date in ISO-8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'End date in ISO-8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
  })
  async getCicdHistoricalData(
    @Query('tags', new ParseArrayPipe({ items: String, separator: ',' }))
    tags: string[],
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.historicalDataService.getProjectSdlcHistoricalData(
      tags,
      startDate,
      endDate,
    );
  }

  @Get('projects/services/:serviceId')
  @ApiOperation({
    summary: 'Get historical data for a specific service of projects',
  })
  @ApiResponse({
    status: 200,
    description: 'Historical data retrieved successfully.',
  })
  @ApiParam({ name: 'serviceId', required: true, type: String })
  @ApiQuery({ name: 'tags', required: true, type: [String] })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date in ISO-8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'End date in ISO-8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
  })
  async getProjectServiceHistoricalData(
    @Param('serviceId') serviceId: string,
    @Query('tags', new ParseArrayPipe({ items: String, separator: ',' }))
    tags: string[],
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.historicalDataService.getProjectServiceHistoricalData(
      tags,
      serviceId,
      startDate,
      endDate,
    );
  }

  @Get('projects/pipelines/:pipelineId')
  @ApiOperation({
    summary: 'Get historical data for a specific pipeline of projects',
  })
  @ApiResponse({
    status: 200,
    description: 'Historical data retrieved successfully.',
  })
  @ApiParam({ name: 'pipelineId', required: true, type: String })
  @ApiQuery({ name: 'tags', required: true, type: [String] })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date in ISO-8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'End date in ISO-8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
  })
  async getProjectPipelineHistoricalData(
    @Param('pipelineId') pipelineId: string,
    @Query('tags', new ParseArrayPipe({ items: String, separator: ',' }))
    tags: string[],
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.historicalDataService.getProjectPipelineHistoricalData(
      tags,
      pipelineId,
      startDate,
      endDate,
    );
  }
}
