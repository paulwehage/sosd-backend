import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class HistoricalDataService {
  constructor(private prisma: PrismaService) {}

  async getCrossProjectHistoricalData(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error(
        'Invalid date format. Please use ISO-8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
      );
    }

    const projects = await this.prisma.project.findMany({
      include: { tags: true },
    });

    const result = [];

    for (const project of projects) {
      const projectTags = project.tags.map((t) => t.name);

      const cicdData = await this.getCicdData(projectTags, start, end);
      const opsData = await this.getOperationsData(projectTags, start, end);

      const projectData = this.aggregateProjectData(
        project,
        cicdData,
        opsData,
        start,
        end,
      );
      result.push(...projectData);
    }

    return result;
  }

  async getProjectSdlcHistoricalData(
    tags: string[],
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error(
        'Invalid date format. Please use ISO-8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
      );
    }

    const cicdData = await this.getCicdData(tags, start, end);
    const opsData = await this.getOperationsData(tags, start, end);

    return this.aggregateSdlcData(cicdData, opsData, start, end);
  }

  private async getCicdData(tags: string[], startDate: Date, endDate: Date) {
    return this.prisma.cicdPipeline.findMany({
      where: {
        tags: { some: { name: { in: tags } } },
      },
      include: {
        cicdPipelineRuns: {
          where: {
            startTime: { gte: startDate, lte: endDate },
          },
          include: {
            cicdPipelineStepMeasurements: true,
          },
        },
      },
    });
  }

  private async getOperationsData(
    tags: string[],
    startDate: Date,
    endDate: Date,
  ) {
    return this.prisma.operationsInfrastructureElement.findMany({
      where: {
        tags: { some: { name: { in: tags } } },
      },
      include: {
        consumptions: {
          where: {
            date: { gte: startDate, lte: endDate },
          },
        },
      },
    });
  }

  private aggregateProjectData(
    project,
    cicdData,
    opsData,
    startDate: Date,
    endDate: Date,
  ) {
    const result = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      const cicdCo2 = this.calculateDailyCicdCo2(cicdData, currentDate);
      const opsCo2 = this.calculateDailyOpsCo2(opsData, currentDate);

      result.push({
        project_id: project.id,
        project_name: project.name,
        date: dateStr,
        total_co2_consumption: cicdCo2 + opsCo2,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  private aggregateSdlcData(cicdData, opsData, startDate: Date, endDate: Date) {
    const result = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      const cicdCo2 = this.calculateDailyCicdCo2(cicdData, currentDate);
      const opsCo2 = this.calculateDailyOpsCo2(opsData, currentDate);

      result.push({
        date: dateStr,
        sdlc_step: 'integration_deployment',
        total_co2_consumption: cicdCo2,
      });

      result.push({
        date: dateStr,
        sdlc_step: 'operations',
        total_co2_consumption: opsCo2,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  private calculateDailyCicdCo2(cicdData, date: Date) {
    return cicdData.reduce((total, pipeline) => {
      const dailyRuns = pipeline.cicdPipelineRuns.filter(
        (run) =>
          new Date(run.startTime).toISOString().split('T')[0] ===
          date.toISOString().split('T')[0],
      );
      const dailyCo2 = dailyRuns.reduce(
        (runTotal, run) =>
          runTotal +
          run.cicdPipelineStepMeasurements.reduce(
            (measurementTotal, measurement) =>
              measurementTotal + measurement.co2Consumption,
            0,
          ),
        0,
      );
      return total + dailyCo2;
    }, 0);
  }

  private calculateDailyOpsCo2(opsData, date: Date) {
    return opsData.reduce((total, element) => {
      const dailyConsumption = element.consumptions.find(
        (c) =>
          new Date(c.date).toISOString().split('T')[0] ===
          date.toISOString().split('T')[0],
      );
      return total + (dailyConsumption ? dailyConsumption.co2Consumption : 0);
    }, 0);
  }

  async getProjectServiceHistoricalData(
    tags: string[],
    serviceId: string,
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error(
        'Invalid date format. Please use ISO-8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
      );
    }

    const serviceIdInt = parseInt(serviceId, 10);
    if (isNaN(serviceIdInt)) {
      throw new Error('Invalid serviceId. Please provide a valid integer.');
    }

    const service = await this.prisma.infrastructureService.findUnique({
      where: { id: serviceIdInt },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    const opsData = await this.getOperationsData(tags, start, end);
    const filteredOpsData = opsData.filter(
      (element) => element.infrastructureServiceId === serviceIdInt,
    );

    return this.aggregateServiceData(service, filteredOpsData, start, end);
  }

  async getProjectPipelineHistoricalData(
    tags: string[],
    pipelineId: string,
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error(
        'Invalid date format. Please use ISO-8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
      );
    }

    const pipelineIdInt = parseInt(pipelineId, 10);
    if (isNaN(pipelineIdInt)) {
      throw new Error('Invalid pipelineId. Please provide a valid integer.');
    }

    const pipeline = await this.prisma.cicdPipeline.findUnique({
      where: { id: pipelineIdInt },
      include: {
        cicdPipelineRuns: {
          where: {
            startTime: { gte: start, lte: end },
          },
          include: {
            cicdPipelineStepMeasurements: true,
          },
        },
      },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID ${pipelineId} not found`);
    }

    return this.aggregatePipelineData(pipeline, start, end);
  }

  private aggregateServiceData(
    service,
    opsData,
    startDate: Date,
    endDate: Date,
  ) {
    const result = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      const co2 = this.calculateDailyOpsCo2(opsData, currentDate);

      result.push({
        service_id: service.id,
        service_type: service.type,
        date: dateStr,
        total_co2_consumption: co2,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  private aggregatePipelineData(pipeline, startDate: Date, endDate: Date) {
    const result = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      const co2 = this.calculateDailyCicdCo2([pipeline], currentDate);

      result.push({
        pipeline_id: pipeline.id,
        pipeline_name: pipeline.pipelineName,
        date: dateStr,
        total_co2_consumption: co2,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }
}
