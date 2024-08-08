import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Project } from '@prisma/client';
import { CreateProjectDto, ProjectDto } from '../dtos/project.dto';

@Injectable()
export class ProjectService {
  constructor(private prismaService: PrismaService) {}

  private mapToDto(project: Project): ProjectDto {
    return {
      ...project,
      tags: JSON.parse(project.tags as string),
    };
  }

  async findAll(): Promise<ProjectDto[]> {
    const projects = await this.prismaService.project.findMany();
    return projects.map(this.mapToDto);
  }

  async findOne(id: number): Promise<ProjectDto> {
    const project = await this.prismaService.project.findUnique({
      where: { id },
    });
    return this.mapToDto(project);
  }

  async create(createProjectDto: CreateProjectDto): Promise<ProjectDto> {
    const project = await this.prismaService.project.create({
      data: {
        ...createProjectDto,
        tags: JSON.stringify(createProjectDto.tags),
      },
    });
    return this.mapToDto(project);
  }

  async update(
    id: number,
    updateProjectDto: CreateProjectDto,
  ): Promise<ProjectDto> {
    const project = await this.prismaService.project.update({
      where: { id },
      data: {
        ...updateProjectDto,
        tags: JSON.stringify(updateProjectDto.tags),
      },
    });
    return this.mapToDto(project);
  }

  async remove(id: number): Promise<void> {
    await this.prismaService.project.delete({ where: { id } });
  }
}
