import { Module } from '@nestjs/common';
import { ProjectController } from './controllers/project.controller';
import { ProjectService } from './services/project.service';
import { PrismaService } from './services/prisma.service';
import { UserFlowService } from './services/userFlow.service';
import { UserFlowController } from './controllers/userFlow.controller';
import { SdlcController } from './controllers/sdlc.controller';
import { SdlcService } from './services/sdlc.service';
import { OperationsController } from './controllers/operations.controller';
import { OperationsService } from './services/operations.service';
import { CicdController } from './controllers/cicd.controller';
import { CicdService } from './services/cicd.service';
import { HistoricalDataService } from './services/historicalData.service';
import { HistoricalDataController } from './controllers/historicalData.controller';

@Module({
  controllers: [
    ProjectController,
    UserFlowController,
    SdlcController,
    OperationsController,
    CicdController,
    HistoricalDataController,
  ],
  providers: [
    ProjectService,
    PrismaService,
    UserFlowService,
    SdlcService,
    OperationsService,
    CicdService,
    HistoricalDataService,
  ],
})
export class AppModule {}
