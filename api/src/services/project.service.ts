import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Project, Tag } from '@prisma/client';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectDto,
  SdlcOverviewDto,
  SdlcStepInfoDto,
} from '../dtos/project.dto';

@Injectable()
export class ProjectService {
  constructor(private prismaService: PrismaService) {}

  private mapToDto(
    project: Project & { tags: Tag[] },
    sdlcOverview?: SdlcOverviewDto,
  ): ProjectDto {
    return {
      ...project,
      tags: project.tags,
      sdlcOverview: sdlcOverview || null,
    };
  }

  async findAll(): Promise<ProjectDto[]> {
    const projects = await this.prismaService.project.findMany({
      include: { tags: true },
    });
    return projects.map((project) => this.mapToDto(project));
  }

  async findOne(id: number): Promise<ProjectDto> {
    const project = await this.prismaService.project.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    const sdlcOverview = await this.getSdlcOverview(id);
    return this.mapToDto(project, sdlcOverview);
  }

  async create(createProjectDto: CreateProjectDto): Promise<ProjectDto> {
    const { tags, ...projectData } = createProjectDto;
    const project = await this.prismaService.project.create({
      data: {
        ...projectData,
        tags: {
          connectOrCreate: tags.map((tag) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
      },
      include: { tags: true },
    });
    return this.mapToDto(project);
  }

  async update(
    id: number,
    updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectDto> {
    const { tags, ...projectData } = updateProjectDto;
    const project = await this.prismaService.project.update({
      where: { id },
      data: {
        ...projectData,
        tags: tags
          ? {
              set: [],
              connectOrCreate: tags.map((tag) => ({
                where: { name: tag },
                create: { name: tag },
              })),
            }
          : undefined,
      },
      include: { tags: true },
    });
    return this.mapToDto(project);
  }

  async remove(id: number): Promise<void> {
    await this.prismaService.project.delete({ where: { id } });
  }

  async getSdlcOverview(projectId: number): Promise<SdlcOverviewDto> {
    const project = await this.prismaService.project.findUnique({
      where: { id: projectId },
      include: { tags: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const projectTags = project.tags.map((tag) => tag.name);

    const sdlcSteps = [
      'design',
      'implementation',
      'testing',
      'integration_deployment',
      'operations',
      'planning',
    ];

    let totalCo2 = 0;
    const stepsWithCo2: SdlcStepInfoDto[] = await Promise.all(
      sdlcSteps.map(async (stepName) => {
        let stepTotalCo2 = 0;

        if (stepName === 'integration_deployment') {
          const matchingPipelines =
            await this.prismaService.cicdPipeline.findMany({
              where: {
                tags: {
                  some: {
                    name: {
                      in: projectTags,
                    },
                  },
                },
              },
              include: {
                cicdPipelineRuns: {
                  include: {
                    cicdPipelineStepMeasurements: true,
                  },
                },
              },
            });

          for (const pipeline of matchingPipelines) {
            for (const run of pipeline.cicdPipelineRuns) {
              for (const measurement of run.cicdPipelineStepMeasurements) {
                stepTotalCo2 += measurement.co2Consumption;
              }
            }
          }
        } else if (stepName === 'operations') {
          const matchingElements =
            await this.prismaService.operationsInfrastructureElement.findMany({
              where: {
                tags: {
                  some: {
                    name: {
                      in: projectTags,
                    },
                  },
                },
              },
              include: {
                consumptions: true,
              },
            });

          for (const element of matchingElements) {
            for (const consumption of element.consumptions) {
              stepTotalCo2 += consumption.co2Consumption;
            }
          }
        }

        totalCo2 += stepTotalCo2;
        return {
          name: stepName,
          totalCo2: stepTotalCo2,
          percentage: 0,
        };
      }),
    );

    // Calculate percentages
    stepsWithCo2.forEach((step) => {
      step.percentage = totalCo2 > 0 ? (step.totalCo2 / totalCo2) * 100 : 0;
    });

    // Sort steps by CO2 consumption (descending)
    stepsWithCo2.sort((a, b) => b.totalCo2 - a.totalCo2);

    return {
      totalCo2,
      steps: stepsWithCo2,
      unit: 'g CO2',
    };
  }
}
