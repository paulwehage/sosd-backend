import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray } from 'class-validator';

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

export class CreateProjectDto {
  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @ApiProperty()
  description: string;

  @IsArray()
  @ApiProperty({ type: [String] })
  tags: string[];
}

export class ProjectDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  lastUpdated: Date;

  @ApiProperty({ type: SdlcOverviewDto })
  sdlcOverview: SdlcOverviewDto;
}
