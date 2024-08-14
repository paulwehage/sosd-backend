import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProjectService } from '../services/project.service';
import { CreateProjectDto, UpdateProjectDto, ProjectDto, SdlcOverviewDto } from '../dtos/project.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('projects')
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'The project has been successfully created.', type: ProjectDto })
  create(@Body() createProjectDto: CreateProjectDto): Promise<ProjectDto> {
    return this.projectService.create(createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects' })
  @ApiResponse({ status: 200, description: 'Return all projects.', type: [ProjectDto] })
  findAll(): Promise<ProjectDto[]> {
    return this.projectService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by id' })
  @ApiResponse({ status: 200, description: 'Return the project.', type: ProjectDto })
  findOne(@Param('id') id: string): Promise<ProjectDto> {
    return this.projectService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiResponse({ status: 200, description: 'The project has been successfully updated.', type: ProjectDto })
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto): Promise<ProjectDto> {
    return this.projectService.update(+id, updateProjectDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  @ApiResponse({ status: 200, description: 'The project has been successfully deleted.' })
  remove(@Param('id') id: string): Promise<void> {
    return this.projectService.remove(+id);
  }
}