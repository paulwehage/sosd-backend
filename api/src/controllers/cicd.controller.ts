import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CicdService } from '../services/cicd.service';
import {
  CicdPipelineDto,
  CreateCicdPipelineDto,
  CicdPipelineRunDto,
  CreateCicdPipelineRunDto,
  CicdPipelineStepMeasurementDto,
  CreateCicdPipelineStepMeasurementDto,
} from '../dtos/cicd.dto';

@ApiTags('CICD')
@Controller('projects/:projectId/sdlc/integration-deployment/cicd-pipelines')
export class CicdController {
  constructor(private readonly cicdService: CicdService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new CICD pipeline' })
  @ApiResponse({
    status: 201,
    description: 'The pipeline has been successfully created.',
    type: CicdPipelineDto,
  })
  @ApiParam({ name: 'projectId', type: 'number' })
  async createPipeline(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() createDto: CreateCicdPipelineDto,
  ): Promise<CicdPipelineDto> {
    return this.cicdService.createPipeline(projectId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all CICD pipelines for a project' })
  @ApiResponse({
    status: 200,
    description: 'Return all CICD pipelines.',
    type: [CicdPipelineDto],
  })
  @ApiParam({ name: 'projectId', type: 'number' })
  async getPipelines(
    @Param('projectId', ParseIntPipe) projectId: number,
  ): Promise<CicdPipelineDto[]> {
    return this.cicdService.getPipelines(projectId);
  }

  @Get('by-tag')
  @ApiOperation({
    summary: 'Get CI/CD pipelines for a project filtered by tag',
  })
  @ApiResponse({
    status: 200,
    description: 'Return CI/CD pipelines filtered by tag.',
    type: [CicdPipelineDto],
  })
  @ApiParam({ name: 'projectId', type: 'number' })
  @ApiQuery({ name: 'tag', required: true, type: String })
  async getPipelinesByTag(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('tag') tag: string,
  ): Promise<CicdPipelineDto[]> {
    return this.cicdService.getPipelinesByTag(projectId, tag);
  }

  @Get(':pipelineId')
  @ApiOperation({ summary: 'Get a specific CICD pipeline' })
  @ApiResponse({
    status: 200,
    description: 'Return the CICD pipeline.',
    type: CicdPipelineDto,
  })
  @ApiParam({ name: 'projectId', type: 'number' })
  @ApiParam({ name: 'pipelineId', type: 'number' })
  async getPipeline(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('pipelineId', ParseIntPipe) pipelineId: number,
  ): Promise<CicdPipelineDto> {
    return this.cicdService.getPipeline(projectId, pipelineId);
  }

  @Post(':pipelineId/runs')
  @ApiOperation({ summary: 'Create a new pipeline run' })
  @ApiResponse({
    status: 201,
    description: 'The pipeline run has been successfully created.',
    type: CicdPipelineRunDto,
  })
  @ApiParam({ name: 'projectId', type: 'number' })
  @ApiParam({ name: 'pipelineId', type: 'number' })
  async createPipelineRun(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('pipelineId', ParseIntPipe) pipelineId: number,
    @Body() createDto: CreateCicdPipelineRunDto,
  ): Promise<CicdPipelineRunDto> {
    return this.cicdService.createPipelineRun(projectId, pipelineId, createDto);
  }

  @Get(':pipelineId/runs')
  @ApiOperation({ summary: 'Get all runs for a specific pipeline' })
  @ApiResponse({
    status: 200,
    description: 'Return all pipeline runs.',
    type: [CicdPipelineRunDto],
  })
  @ApiParam({ name: 'projectId', type: 'number' })
  @ApiParam({ name: 'pipelineId', type: 'number' })
  async getPipelineRuns(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('pipelineId', ParseIntPipe) pipelineId: number,
  ): Promise<CicdPipelineRunDto[]> {
    return this.cicdService.getPipelineRuns(projectId, pipelineId);
  }

  @Post(':pipelineId/runs/:runId/measurements')
  @ApiOperation({ summary: 'Create a new step measurement for a pipeline run' })
  @ApiResponse({
    status: 201,
    description: 'The step measurement has been successfully created.',
    type: CicdPipelineStepMeasurementDto,
  })
  @ApiParam({ name: 'projectId', type: 'number' })
  @ApiParam({ name: 'pipelineId', type: 'number' })
  @ApiParam({ name: 'runId', type: 'number' })
  async createStepMeasurement(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('pipelineId', ParseIntPipe) pipelineId: number,
    @Param('runId', ParseIntPipe) runId: number,
    @Body() createDto: CreateCicdPipelineStepMeasurementDto,
  ): Promise<CicdPipelineStepMeasurementDto> {
    return this.cicdService.createStepMeasurement(
      projectId,
      pipelineId,
      runId,
      createDto,
    );
  }

  @Get(':pipelineId/runs/:runId/measurements')
  @ApiOperation({
    summary: 'Get all step measurements for a specific pipeline run',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all step measurements for the pipeline run.',
    type: [CicdPipelineStepMeasurementDto],
  })
  @ApiParam({ name: 'projectId', type: 'number' })
  @ApiParam({ name: 'pipelineId', type: 'number' })
  @ApiParam({ name: 'runId', type: 'number' })
  async getStepMeasurements(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('pipelineId', ParseIntPipe) pipelineId: number,
    @Param('runId', ParseIntPipe) runId: number,
  ): Promise<CicdPipelineStepMeasurementDto[]> {
    return this.cicdService.getStepMeasurements(projectId, pipelineId, runId);
  }
}
