import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
  ParseArrayPipe,
  ParseBoolPipe,
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

@ApiTags('Integration / Deployment')
@Controller('/integration-deployment/cicd-pipelines')
export class CicdController {
  constructor(private readonly cicdService: CicdService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new CICD pipeline' })
  @ApiResponse({
    status: 201,
    description: 'The pipeline has been successfully created.',
    type: CicdPipelineDto,
  })
  async createPipeline(
    @Body() createDto: CreateCicdPipelineDto,
  ): Promise<CicdPipelineDto> {
    return this.cicdService.createPipeline(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get CI/CD pipelines filtered by tags' })
  @ApiResponse({
    status: 200,
    description: 'Return CI/CD pipelines filtered by tags.',
    type: [CicdPipelineDto],
  })
  @ApiQuery({ name: 'tags', required: true, type: [String], isArray: true })
  @ApiQuery({ name: 'matchAll', required: false, type: Boolean })
  async getPipelinesByTags(
    @Query('tags', new ParseArrayPipe({ items: String, separator: ',' }))
    tags: string[],
    @Query('matchAll', new ParseBoolPipe({ optional: true }))
    matchAll: boolean = false,
  ): Promise<CicdPipelineDto[]> {
    console.log('Controller Tags:', tags);
    console.log('Controller MatchAll:', matchAll);
    return await this.cicdService.getPipelinesByTags(tags, matchAll);
  }

  @Get(':pipelineId')
  @ApiOperation({ summary: 'Get a specific CICD pipeline' })
  @ApiResponse({
    status: 200,
    description: 'Return the CICD pipeline.',
    type: CicdPipelineDto,
  })
  @ApiParam({ name: 'pipelineId', type: 'number' })
  async getPipeline(
    @Param('pipelineId', ParseIntPipe) pipelineId: number,
  ): Promise<CicdPipelineDto> {
    return this.cicdService.getPipeline(pipelineId);
  }

  @Post(':pipelineId/runs')
  @ApiOperation({ summary: 'Create a new pipeline run' })
  @ApiResponse({
    status: 201,
    description: 'The pipeline run has been successfully created.',
    type: CicdPipelineRunDto,
  })
  @ApiParam({ name: 'pipelineId', type: 'number' })
  async createPipelineRun(
    @Param('pipelineId', ParseIntPipe) pipelineId: number,
    @Body() createDto: CreateCicdPipelineRunDto,
  ): Promise<CicdPipelineRunDto> {
    return this.cicdService.createPipelineRun(pipelineId, createDto);
  }

  @Get(':pipelineId/runs')
  @ApiOperation({ summary: 'Get all runs for a specific pipeline' })
  @ApiResponse({
    status: 200,
    description: 'Return all pipeline runs.',
    type: [CicdPipelineRunDto],
  })
  @ApiParam({ name: 'pipelineId', type: 'number' })
  async getPipelineRuns(
    @Param('pipelineId', ParseIntPipe) pipelineId: number,
  ): Promise<CicdPipelineRunDto[]> {
    return this.cicdService.getPipelineRuns(pipelineId);
  }

  @Post(':pipelineId/runs/:runId/measurements')
  @ApiOperation({ summary: 'Create a new step measurement for a pipeline run' })
  @ApiResponse({
    status: 201,
    description: 'The step measurement has been successfully created.',
    type: CicdPipelineStepMeasurementDto,
  })
  @ApiParam({ name: 'pipelineId', type: 'number' })
  @ApiParam({ name: 'runId', type: 'number' })
  async createStepMeasurement(
    @Param('pipelineId', ParseIntPipe) pipelineId: number,
    @Param('runId', ParseIntPipe) runId: number,
    @Body() createDto: CreateCicdPipelineStepMeasurementDto,
  ): Promise<CicdPipelineStepMeasurementDto> {
    return this.cicdService.createStepMeasurement(pipelineId, runId, createDto);
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
  @ApiParam({ name: 'pipelineId', type: 'number' })
  @ApiParam({ name: 'runId', type: 'number' })
  async getStepMeasurements(
    @Param('pipelineId', ParseIntPipe) pipelineId: number,
    @Param('runId', ParseIntPipe) runId: number,
  ): Promise<CicdPipelineStepMeasurementDto[]> {
    return this.cicdService.getStepMeasurements(pipelineId, runId);
  }
}
