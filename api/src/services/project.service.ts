import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Project } from '@prisma/client';
import { CreateProjectDto } from '../dtos/project.dto';

@Injectable()
export class ProjectService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  async findAll(): Promise<Project[]> {
    return this.prismaService.project.findMany();
  }

  async findOne(id: number): Promise<Project> {
    return this.prismaService.project.findUnique({ where: { id } });
  }

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    return this.prismaService.project.create({ data: createProjectDto });
  }
  async update(
    id: number,
    updateProjectDto: CreateProjectDto,
  ): Promise<Project> {
    return this.prismaService.project.update({
      where: { id },
      data: updateProjectDto,
    });
  }

  async remove(id: number): Promise<void> {
    await this.prismaService.project.delete({ where: { id } });
  }
}
