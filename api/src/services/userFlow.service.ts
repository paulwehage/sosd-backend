import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateUserFlowDto, UserFlowDto } from '../dtos/userflow.dto';

@Injectable()
export class UserFlowService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  async findAll(projectId: number): Promise<UserFlowDto[]> {
    const allUserFlows = await this.prismaService.userFlow.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    const latestUserFlows = allUserFlows.reduce((acc, current) => {
      if (
        !acc[current.name] ||
        acc[current.name].createdAt < current.createdAt
      ) {
        acc[current.name] = current;
      }
      return acc;
    }, {});

    return Object.values(latestUserFlows);
  }

  async findOne(projectId: number, id: number): Promise<UserFlowDto> {
    const userFlow = await this.prismaService.userFlow.findFirst({
      where: { id, projectId },
    });

    if (!userFlow) {
      throw new NotFoundException(
        `User flow with ID ${id} not found in project ${projectId}`,
      );
    }

    return userFlow;
  }

  async create(
    projectId: number,
    createUserFlowDto: CreateUserFlowDto,
  ): Promise<UserFlowDto> {
    return this.prismaService.userFlow.create({
      data: {
        ...createUserFlowDto,
        projectId,
      },
    });
  }

  async update(
    projectId: number,
    id: number,
    updateUserFlowDto: CreateUserFlowDto,
  ): Promise<UserFlowDto> {
    const existingUserFlow = await this.prismaService.userFlow.findFirst({
      where: { id, projectId },
    });

    if (!existingUserFlow) {
      throw new NotFoundException(
        `User flow with ID ${id} not found in project ${projectId}`,
      );
    }

    return this.prismaService.userFlow.update({
      where: { id },
      data: updateUserFlowDto,
    });
  }

  async remove(projectId: number, id: number): Promise<void> {
    const existingUserFlow = await this.prismaService.userFlow.findFirst({
      where: { id, projectId },
    });

    if (!existingUserFlow) {
      throw new NotFoundException(
        `User flow with ID ${id} not found in project ${projectId}`,
      );
    }

    await this.prismaService.userFlow.delete({ where: { id } });
  }
}
