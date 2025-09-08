import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsDateString, IsNumber, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { UserStatsResponseModel, UserRegistrationStatModel } from "../models/user-stats-response.model";

export class UserRegistrationStatDto implements UserRegistrationStatModel {
  @ApiProperty({ example: "2024-01-01" })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  count!: number;

  constructor(partial: Partial<UserRegistrationStatDto>) {
    Object.assign(this, partial);
  }
}

export class UserStatsResponseDto implements UserStatsResponseModel {
  @ApiProperty({ description: "Total number of users", example: 123 })
  @IsNumber()
  total!: number;

  @ApiProperty({
    description: "Daily registrations for the last 30 days",
    type: [UserRegistrationStatDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserRegistrationStatDto)
  registrations!: UserRegistrationStatDto[];

  @ApiProperty({
    description: "Percentage change compared to previous period",
    example: 12.5,
  })
  @IsNumber()
  trend!: number;

  constructor(partial: Partial<UserStatsResponseModel>) {
    Object.assign(this, partial);
  }
}
