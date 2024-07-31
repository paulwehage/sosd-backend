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

@Module({
  controllers: [
    ProjectController,
    UserFlowController,
    SdlcController,
    OperationsController,
    CicdController,
  ],
  providers: [
    ProjectService,
    PrismaService,
    UserFlowService,
    SdlcService,
    OperationsService,
    CicdService,
  ],
})
export class AppModule {}
