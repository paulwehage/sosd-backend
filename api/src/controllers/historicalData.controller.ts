import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
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
  @ApiQuery({ name: 'startDate', required: true, type: Date })
  @ApiQuery({ name: 'endDate', required: true, type: Date })
  async getCrossProjectHistoricalData(
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ) {
    return this.historicalDataService.getCrossProjectHistoricalData(
      startDate,
      endDate,
    );
  }

  @Get('projects/:projectId/sdlc')
  @ApiOperation({ summary: 'Get historical data for SDLC steps of a project' })
  @ApiResponse({
    status: 200,
    description: 'Historical data retrieved successfully.',
  })
  @ApiParam({ name: 'projectId', type: 'number' })
  @ApiQuery({ name: 'startDate', required: true, type: Date })
  @ApiQuery({ name: 'endDate', required: true, type: Date })
  async getProjectSdlcHistoricalData(
    @Param('projectId') projectId: number,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ) {
    return this.historicalDataService.getProjectSdlcHistoricalData(
      projectId,
      startDate,
      endDate,
    );
  }

  @Get('projects/:projectId/operations')
  @ApiOperation({ summary: 'Get historical data for operations of a project' })
  @ApiResponse({
    status: 200,
    description: 'Historical data retrieved successfully.',
  })
  @ApiParam({ name: 'projectId', type: 'number' })
  @ApiQuery({ name: 'startDate', required: true, type: Date })
  @ApiQuery({ name: 'endDate', required: true, type: Date })
  async getOperationsHistoricalData(
    @Param('projectId') projectId: number,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ) {
    return this.historicalDataService.getOperationsHistoricalData(
      projectId,
      startDate,
      endDate,
    );
  }

  @Get('projects/:projectId/cicd')
  @ApiOperation({ summary: 'Get historical data for CICD of a project' })
  @ApiResponse({
    status: 200,
    description: 'Historical data retrieved successfully.',
  })
  @ApiParam({ name: 'projectId', type: 'number' })
  @ApiQuery({ name: 'startDate', required: true, type: Date })
  @ApiQuery({ name: 'endDate', required: true, type: Date })
  async getCicdHistoricalData(
    @Param('projectId') projectId: number,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ) {
    return this.historicalDataService.getCicdHistoricalData(
      projectId,
      startDate,
      endDate,
    );
  }

  @Get('projects/:projectId/services/:serviceId')
  @ApiOperation({
    summary: 'Get historical data for a specific service of a project',
  })
  @ApiResponse({
    status: 200,
    description: 'Historical data retrieved successfully.',
  })
  @ApiParam({ name: 'projectId', type: 'number' })
  @ApiParam({ name: 'serviceId', type: 'number' })
  @ApiQuery({ name: 'startDate', required: true, type: Date })
  @ApiQuery({ name: 'endDate', required: true, type: Date })
  async getProjectServiceHistoricalData(
    @Param('projectId') projectId: number,
    @Param('serviceId') serviceId: number,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ) {
    return this.historicalDataService.getProjectServiceHistoricalData(
      projectId,
      serviceId,
      startDate,
      endDate,
    );
  }

  @Get('projects/:projectId/pipelines/:pipelineId')
  @ApiOperation({
    summary: 'Get historical data for a specific pipeline of a project',
  })
  @ApiResponse({
    status: 200,
    description: 'Historical data retrieved successfully.',
  })
  @ApiParam({ name: 'projectId', type: 'number' })
  @ApiParam({ name: 'pipelineId', type: 'number' })
  @ApiQuery({ name: 'startDate', required: true, type: Date })
  @ApiQuery({ name: 'endDate', required: true, type: Date })
  async getProjectPipelineHistoricalData(
    @Param('projectId') projectId: number,
    @Param('pipelineId') pipelineId: number,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ) {
    return this.historicalDataService.getProjectPipelineHistoricalData(
      projectId,
      pipelineId,
      startDate,
      endDate,
    );
  }
}
