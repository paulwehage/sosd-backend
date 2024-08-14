import { ApiProperty } from '@nestjs/swagger';

export class TagDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}

export class SdlcStepInfoDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  totalCo2: number;

  @ApiProperty()
  percentage: number;
}

export class SdlcOverviewDto {
  @ApiProperty()
  totalCo2: number;

  @ApiProperty({ type: [SdlcStepInfoDto] })
  steps: SdlcStepInfoDto[];

  @ApiProperty()
  unit: string;
}

export class ProjectDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  lastUpdated: Date;

  @ApiProperty({ type: [TagDto] })
  tags: TagDto[];

  @ApiProperty({ required: false, nullable: true })
  sdlcOverview?: SdlcOverviewDto | null;
}

export class CreateProjectDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: [String] })
  tags: string[];
}

export class UpdateProjectDto {
  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ type: [String], required: false })
  tags?: string[];
}
