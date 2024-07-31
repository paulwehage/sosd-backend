import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateUserFlowDto {
  @ApiProperty({
    description: 'The ID of the project this user flow belongs to',
  })
  @IsNumber()
  projectId: number;

  @ApiProperty({ description: 'The name of the user flow' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'The CO2 consumption of the user flow' })
  @IsNumber()
  co2Consumption: number;
}

export class UserFlowDto {
  @ApiProperty({ description: 'The unique identifier of the user flow' })
  id: number;

  @ApiProperty({
    description: 'The ID of the project this user flow belongs to',
  })
  projectId: number;

  @ApiProperty({ description: 'The name of the user flow' })
  name: string;

  @ApiProperty({ description: 'The CO2 consumption of the user flow' })
  co2Consumption: number;
}
