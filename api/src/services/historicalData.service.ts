import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class HistoricalDataService {
  constructor(private prisma: PrismaService) {}

  /**
   * Retrieves cross-project historical data within a specified date range.
   * @param startDate - The start date of the range in ISO-8601 format.
   * @param endDate - The end date of the range in ISO-8601 format.
   * @returns An array of aggregated project data.
   */
  async getCrossProjectHistoricalData(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    this.validateDates(start, end);

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

  /**
   * Retrieves SDLC historical data for a project within a specified date range.
   * @param tags - An array of tags to filter the project.
   * @param startDate - The start date of the range in ISO-8601 format.
   * @param endDate - The end date of the range in ISO-8601 format.
   * @returns An array of aggregated SDLC data.
   */
  async getProjectSdlcHistoricalData(
    tags: string[],
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    this.validateDates(start, end);

    const cicdData = await this.getCicdData(tags, start, end);
    const opsData = await this.getOperationsData(tags, start, end);

    return this.aggregateSdlcData(cicdData, opsData, start, end);
  }

  /**
   * Retrieves operations historical data for a project within a specified date range.
   * @param tags - An array of tags to filter the project.
   * @param startDate - The start date of the range in ISO-8601 format.
   * @param endDate - The end date of the range in ISO-8601 format.
   * @returns An array of aggregated operations data.
   */
  async getProjectOperationsHistoricalData(
    tags: string[],
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    this.validateDates(start, end);

    const operationsData = await this.getOperationsData(tags, start, end);
    return this.aggregateOperationsData(operationsData, start, end);
  }

  /**
   * Retrieves CI/CD historical data for a project within a specified date range.
   * @param tags - An array of tags to filter the project.
   * @param startDate - The start date of the range in ISO-8601 format.
   * @param endDate - The end date of the range in ISO-8601 format.
   * @returns An array of aggregated CI/CD data.
   */
  async getProjectCicdHistoricalData(
    tags: string[],
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    this.validateDates(start, end);

    const cicdData = await this.getCicdData(tags, start, end);
    return this.aggregateCicdDataByPipeline(cicdData, start, end);
  }

  /**
   * Retrieves historical data for a specific service within a project.
   * @param tags - An array of tags to filter the project.
   * @param serviceId - The ID of the service.
   * @param startDate - The start date of the range in ISO-8601 format.
   * @param endDate - The end date of the range in ISO-8601 format.
   * @returns An array of aggregated service data.
   * @throws NotFoundException if the service is not found.
   */
  async getProjectServiceHistoricalData(
    tags: string[],
    serviceId: string,
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    this.validateDates(start, end);
    const serviceIdInt = this.validateServiceId(serviceId);

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

  /**
   * Retrieves historical data for a specific pipeline within a project.
   * @param tags - An array of tags to filter the project.
   * @param pipelineId - The ID of the pipeline.
   * @param startDate - The start date of the range in ISO-8601 format.
   * @param endDate - The end date of the range in ISO-8601 format.
   * @returns An array of aggregated pipeline data.
   * @throws NotFoundException if the pipeline is not found.
   */
  async getProjectPipelineHistoricalData(
    tags: string[],
    pipelineId: string,
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    this.validateDates(start, end);
    const pipelineIdInt = this.validatePipelineId(pipelineId);

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

  /**
   * Validates the provided start and end dates.
   * @param startDate - The start date to validate.
   * @param endDate - The end date to validate.
   * @throws Error if the dates are invalid.
   */
  private validateDates(startDate: Date, endDate: Date) {
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error(
        'Invalid date format. Please use ISO-8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
      );
    }
  }

  /**
   * Validates the provided service ID.
   * @param serviceId - The service ID to validate.
   * @returns The validated service ID as an integer.
   * @throws Error if the service ID is invalid.
   */
  private validateServiceId(serviceId: string): number {
    const serviceIdInt = parseInt(serviceId, 10);
    if (isNaN(serviceIdInt)) {
      throw new Error('Invalid serviceId. Please provide a valid integer.');
    }
    return serviceIdInt;
  }

  /**
   * Validates the provided pipeline ID.
   * @param pipelineId - The pipeline ID to validate.
   * @returns The validated pipeline ID as an integer.
   * @throws Error if the pipeline ID is invalid.
   */
  private validatePipelineId(pipelineId: string): number {
    const pipelineIdInt = parseInt(pipelineId, 10);
    if (isNaN(pipelineIdInt)) {
      throw new Error('Invalid pipelineId. Please provide a valid integer.');
    }
    return pipelineIdInt;
  }

  /**
   * Fetches CI/CD data for the specified tags and date range.
   * @param tags - An array of tags to filter the data.
   * @param startDate - The start date of the range.
   * @param endDate - The end date of the range.
   * @returns An array of CI/CD data.
   */
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

  /**
   * Fetches operations data for the specified tags and date range.
   * @param tags - An array of tags to filter the data.
   * @param startDate - The start date of the range.
   * @param endDate - The end date of the range.
   * @returns An array of operations data.
   * @throws Error if there is an issue fetching the data.
   */
  private async getOperationsData(
    tags: string[],
    startDate: Date,
    endDate: Date,
  ) {
    try {
      return await this.prisma.operationsInfrastructureElement.findMany({
        where: {
          tags: { some: { name: { in: tags } } },
        },
        include: {
          infrastructureService: {
            include: {
              cloudProvider: true,
            },
          },
          consumptions: {
            where: {
              date: { gte: startDate, lte: endDate },
            },
          },
        },
      });
    } catch (error) {
      console.error(
        `Error fetching operations data: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Aggregates project data for the specified date range.
   * @param project - The project entity.
   * @param cicdData - The CI/CD data.
   * @param opsData - The operations data.
   * @param startDate - The start date of the range.
   * @param endDate - The end date of the range.
   * @returns An array of aggregated project data.
   */
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

  /**
   * Aggregates SDLC data for the specified date range.
   * @param cicdData - The CI/CD data.
   * @param opsData - The operations data.
   * @param startDate - The start date of the range.
   * @param endDate - The end date of the range.
   * @returns An array of aggregated SDLC data.
   */
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

  /**
   * Aggregates operations data for the specified date range.
   * @param operationsData - The operations data.
   * @param startDate - The start date of the range.
   * @param endDate - The end date of the range.
   * @returns An array of aggregated operations data.
   */
  private aggregateOperationsData(
    operationsData,
    startDate: Date,
    endDate: Date,
  ) {
    const result = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      for (const element of operationsData) {
        if (!element.consumptions || !Array.isArray(element.consumptions)) {
          console.warn(`No consumptions found for element: ${element.id}`);
          continue;
        }

        const dailyConsumption = element.consumptions.find(
          (c) => new Date(c.date).toISOString().split('T')[0] === dateStr,
        );

        if (dailyConsumption) {
          result.push({
            date: dateStr,
            infrastructure_element_name: element.name,
            service_name: element.infrastructureService.type,
            cloud_provider: element.infrastructureService.cloudProvider.name,
            total_co2_consumption: dailyConsumption.co2Consumption,
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  /**
   * Aggregates CI/CD data by pipeline for the specified date range.
   * @param cicdData - The CI/CD data.
   * @param startDate - The start date of the range.
   * @param endDate - The end date of the range.
   * @returns An array of aggregated CI/CD data by pipeline.
   */
  private aggregateCicdDataByPipeline(
    cicdData,
    startDate: Date,
    endDate: Date,
  ) {
    const result = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      for (const pipeline of cicdData) {
        const dailyCo2 = this.calculateDailyCicdCo2ForPipeline(
          pipeline,
          currentDate,
        );

        result.push({
          date: dateStr,
          pipelineName: pipeline.pipelineName,
          cloudProvider: pipeline.cloudProvider,
          total_co2_consumption: dailyCo2,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  /**
   * Aggregates service data for the specified date range.
   * @param service - The service entity.
   * @param opsData - The operations data.
   * @param startDate - The start date of the range.
   * @param endDate - The end date of the range.
   * @returns An array of aggregated service data.
   */
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

  /**
   * Aggregates pipeline data for the specified date range.
   * @param pipeline - The pipeline entity.
   * @param startDate - The start date of the range.
   * @param endDate - The end date of the range.
   * @returns An array of aggregated pipeline data.
   */
  private aggregatePipelineData(pipeline, startDate: Date, endDate: Date) {
    const result = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      const co2 = this.calculateDailyCicdCo2ForPipeline(pipeline, currentDate);

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

  /**
   * Calculates the daily CO2 consumption for CI/CD data.
   * @param cicdData - The CI/CD data.
   * @param date - The date to calculate for.
   * @returns The total daily CO2 consumption.
   */
  private calculateDailyCicdCo2(cicdData, date: Date) {
    return cicdData.reduce((total, pipeline) => {
      return total + this.calculateDailyCicdCo2ForPipeline(pipeline, date);
    }, 0);
  }

  /**
   * Calculates the daily CO2 consumption for a specific pipeline.
   * @param pipeline - The pipeline entity.
   * @param date - The date to calculate for.
   * @returns The total daily CO2 consumption for the pipeline.
   */
  private calculateDailyCicdCo2ForPipeline(pipeline, date: Date) {
    const dailyRuns = pipeline.cicdPipelineRuns.filter(
      (run) =>
        new Date(run.startTime).toISOString().split('T')[0] ===
        date.toISOString().split('T')[0],
    );

    return dailyRuns.reduce(
      (runTotal, run) =>
        runTotal +
        run.cicdPipelineStepMeasurements.reduce(
          (measurementTotal, measurement) =>
            measurementTotal + measurement.co2Consumption,
          0,
        ),
      0,
    );
  }

  /**
   * Calculates the daily CO2 consumption for operations data.
   * @param opsData - The operations data.
   * @param date - The date to calculate for.
   * @returns The total daily CO2 consumption for operations.
   */
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
}
