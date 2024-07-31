import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SdlcService } from '../services/sdlc.service';
import { SdlcStepName } from '@prisma/client';

@ApiTags('SDLC')
@Controller('projects/:projectId/sdlc')
export class SdlcController {
  constructor(private readonly sdlcService: SdlcService) {}
  @Get()
  @ApiOperation({ summary: 'Get SDLC overview for a project' })
  @ApiResponse({ status: 200, description: 'Return the SDLC overview.' })
  @ApiParam({ name: 'projectId', type: 'number' })
  getProjectSdlcOverview(@Param('projectId') projectId: string) {
    return this.sdlcService.getProjectSdlcOverview(+projectId);
  }

  @Get(':step')
  @ApiOperation({ summary: 'Get info for a specific SDLC step' })
  @ApiResponse({ status: 200, description: 'Return the step info.' })
  @ApiParam({ name: 'projectId', type: 'number' })
  @ApiParam({ name: 'step', enum: SdlcStepName })
  getStepInfo(
    @Param('projectId') projectId: string,
    @Param('step') step: SdlcStepName,
  ) {
    return this.sdlcService.getStepInfo(+projectId, step);
  }
}
