import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class HistoricalDataService {
  constructor(private prisma: PrismaService) {}

  async getCrossProjectHistoricalData(startDate: Date, endDate: Date) {
    return this.prisma.$queryRaw`
      SELECT * FROM cross_project_historical_data
      WHERE date BETWEEN ${startDate} AND ${endDate}
    `;
  }

  async getProjectSdlcHistoricalData(
    projectId: number,
    startDate: Date,
    endDate: Date,
  ) {
    return this.prisma.$queryRaw`
      SELECT * FROM project_sdlc_historical_data
      WHERE project_id = ${projectId} AND date BETWEEN ${startDate} AND ${endDate}
    `;
  }

  async getOperationsHistoricalData(
    projectId: number,
    startDate: Date,
    endDate: Date,
  ) {
    return this.prisma.$queryRaw`
      SELECT * FROM operations_historical_data
      WHERE project_id = ${projectId} AND date BETWEEN ${startDate} AND ${endDate}
    `;
  }

  async getCicdHistoricalData(
    projectId: number,
    startDate: Date,
    endDate: Date,
  ) {
    return this.prisma.$queryRaw`
      SELECT * FROM cicd_historical_data
      WHERE project_id = ${projectId} AND date BETWEEN ${startDate} AND ${endDate}
    `;
  }

  async getProjectServiceHistoricalData(
    projectId: number,
    serviceId: number,
    startDate: Date,
    endDate: Date,
  ) {
    return this.prisma.$queryRaw`
      SELECT * FROM project_service_historical_data
      WHERE project_id = ${projectId} AND service_id = ${serviceId} AND date BETWEEN ${startDate} AND ${endDate}
      ORDER BY date
    `;
  }

  async getProjectPipelineHistoricalData(
    projectId: number,
    pipelineId: number,
    startDate: Date,
    endDate: Date,
  ) {
    return this.prisma.$queryRaw`
      SELECT * FROM project_pipeline_historical_data
      WHERE project_id = ${projectId} AND pipeline_id = ${pipelineId} AND date BETWEEN ${startDate} AND ${endDate}
      ORDER BY date
    `;
  }
}
