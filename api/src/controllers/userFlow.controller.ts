import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateUserFlowDto, UserFlowDto } from '../dtos/userFlow.dto';
import { UserFlowService } from '../services/userFlow.service';

@ApiTags('User Flows')
@Controller('projects/:projectId/user-flows')
export class UserFlowController {
  constructor(private readonly userFlowService: UserFlowService) {}

  @Get()
  @ApiOperation({ summary: 'Get all user flows for a specific project' })
  @ApiResponse({
    status: 200,
    description: 'Return all user flows for the project.',
    type: [UserFlowDto],
  })
  @ApiParam({ name: 'projectId', type: 'number' })
  findAll(
    @Param('projectId', ParseIntPipe) projectId: number,
  ): Promise<UserFlowDto[]> {
    return this.userFlowService.findAll(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific user flow for a project' })
  @ApiResponse({
    status: 200,
    description: 'Return the user flow.',
    type: UserFlowDto,
  })
  @ApiResponse({ status: 404, description: 'User flow not found.' })
  @ApiParam({ name: 'projectId', type: 'number' })
  @ApiParam({ name: 'id', type: 'number' })
  findOne(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserFlowDto> {
    return this.userFlowService.findOne(projectId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user flow for a project' })
  @ApiResponse({
    status: 201,
    description: 'The user flow has been successfully created.',
    type: UserFlowDto,
  })
  @ApiParam({ name: 'projectId', type: 'number' })
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() createUserFlowDto: CreateUserFlowDto,
  ): Promise<UserFlowDto> {
    return this.userFlowService.create(projectId, createUserFlowDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user flow for a project' })
  @ApiResponse({
    status: 200,
    description: 'The user flow has been successfully updated.',
    type: UserFlowDto,
  })
  @ApiResponse({ status: 404, description: 'User flow not found.' })
  @ApiParam({ name: 'projectId', type: 'number' })
  @ApiParam({ name: 'id', type: 'number' })
  update(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserFlowDto: CreateUserFlowDto,
  ): Promise<UserFlowDto> {
    return this.userFlowService.update(projectId, id, updateUserFlowDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user flow from a project' })
  @ApiResponse({
    status: 204,
    description: 'The user flow has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'User flow not found.' })
  @ApiParam({ name: 'projectId', type: 'number' })
  @ApiParam({ name: 'id', type: 'number' })
  remove(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.userFlowService.remove(projectId, id);
  }
}
