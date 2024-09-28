import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateUserFlowDto, UserFlowDto } from '../dtos/userflow.dto';

@Injectable()
export class UserFlowService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  /**
   * Retrieves all user flows for a given project.
   * @param projectId - The ID of the project.
   * @returns An array of UserFlowDto containing the latest user flows.
   */
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

  /**
   * Retrieves a user flow by its ID and project ID.
   * @param projectId - The ID of the project.
   * @param id - The ID of the user flow.
   * @returns The UserFlowDto.
   * @throws NotFoundException if the user flow is not found.
   */
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

  /**
   * Creates a new user flow for a given project.
   * @param projectId - The ID of the project.
   * @param createUserFlowDto - Data transfer object containing the details for the new user flow.
   * @returns The created UserFlowDto.
   */
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

  /**
   * Updates an existing user flow.
   * @param projectId - The ID of the project.
   * @param id - The ID of the user flow to update.
   * @param updateUserFlowDto - Data transfer object containing the updated details for the user flow.
   * @returns The updated UserFlowDto.
   * @throws NotFoundException if the user flow is not found.
   */
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

  /**
   * Deletes a user flow by its ID and project ID.
   * @param projectId - The ID of the project.
   * @param id - The ID of the user flow to delete.
   * @returns void
   * @throws NotFoundException if the user flow is not found.
   */
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