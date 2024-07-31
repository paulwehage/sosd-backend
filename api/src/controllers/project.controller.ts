import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Delete,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { ProjectService } from '../services/project.service';
import { CreateProjectDto, ProjectDto } from '../dtos/project.dto';

@ApiTags('Projects')
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @ApiOperation({ summary: 'Get all projects' })
  @ApiResponse({
    status: 200,
    description: 'Return all projects',
    type: [ProjectDto],
  })
  findAll(): Promise<ProjectDto[]> {
    return this.projectService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'The ID of the project' })
  @ApiResponse({
    status: 200,
    description: 'Return the project',
    type: ProjectDto,
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findOne(@Param('id') id: number): Promise<ProjectDto> {
    return this.projectService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({
    status: 201,
    description: 'The project has been created',
    type: ProjectDto,
  })
  async create(
    @Body() createProjectDto: CreateProjectDto,
  ): Promise<ProjectDto> {
    return this.projectService.create(createProjectDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update project by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'The ID of the project' })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({
    status: 200,
    description: 'The project has been updated',
    type: ProjectDto,
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async update(
    @Param('id') id: number,
    @Body() updateProjectDto: CreateProjectDto,
  ): Promise<ProjectDto> {
    return this.projectService.update(+id, updateProjectDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'The ID of the project' })
  @ApiResponse({ status: 200, description: 'The project has been deleted' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async remove(@Param('id') id: number): Promise<void> {
    return this.projectService.remove(+id);
  }
}
