import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { Project } from '../entities/project.entity';
import { ProjectService } from '../services/project.service';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  findAll(): Promise<Project[]> {
    return this.projectService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Project> {
    return this.projectService.findOne(id);
  }

  @Post()
  create(@Body() project: Project): Promise<Project> {
    return this.projectService.create(project);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.projectService.remove(id);
  }
}
