import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Project } from '@prisma/client';
import {
  CreateProjectDto,
  ProjectDto,
  SdlcOverviewDto,
  SdlcStepInfoDto,
} from '../dtos/project.dto';

@Injectable()
export class ProjectService {
  constructor(private prismaService: PrismaService) {}

  private mapToDto(
    project: Project,
    sdlcOverview?: SdlcOverviewDto,
  ): ProjectDto {
    return {
      ...project,
      tags: JSON.parse(project.tags as string),
      sdlcOverview: sdlcOverview || null,
    };
  }

  async findAll(): Promise<ProjectDto[]> {
    const projects = await this.prismaService.project.findMany();
    return projects.map((project) => this.mapToDto(project));
  }

  async findOne(id: number): Promise<ProjectDto> {
    const project = await this.prismaService.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    const sdlcOverview = await this.getSdlcOverview(id);
    return this.mapToDto(project, sdlcOverview);
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

  async getSdlcOverview(projectId: number): Promise<SdlcOverviewDto> {
    const project = await this.prismaService.project.findUnique({
      where: { id: projectId },
      select: { tags: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const projectTags = JSON.parse(project.tags as string);

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
          // Fetch all pipelines and filter in application logic
          const allPipelines = await this.prismaService.cicdPipeline.findMany({
            include: {
              cicdPipelineRuns: {
                include: {
                  cicdPipelineStepMeasurements: true,
                },
              },
            },
          });

          const matchingPipelines = allPipelines.filter((pipeline) => {
            const pipelineTags = JSON.parse(pipeline.tags as string);
            return projectTags.some((tag) => pipelineTags.includes(tag));
          });

          for (const pipeline of matchingPipelines) {
            for (const run of pipeline.cicdPipelineRuns) {
              for (const measurement of run.cicdPipelineStepMeasurements) {
                stepTotalCo2 += measurement.co2Consumption;
              }
            }
          }
        } else if (stepName === 'operations') {
          // Fetch all infrastructure elements and filter in application logic
          const allElements =
            await this.prismaService.operationsInfrastructureElement.findMany({
              include: {
                consumptions: true,
              },
            });

          const matchingElements = allElements.filter((element) => {
            const elementTags = JSON.parse(element.tags as string);
            return projectTags.some((tag) => elementTags.includes(tag));
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
