import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Transform, Type } from "class-transformer";
import { ObjectId } from "mongoose";
import { UserStatus } from "../models/user-status.enum";
import { UserResponseModel } from "../models/user-response.model";
import {
  IsEmail,
  IsString,
  IsEnum,
  IsArray,
  IsDateString,
  ValidateNested,
} from "class-validator";
import { UserConsentDto } from "./user-consent.dto";

export class UserResponseDto implements UserResponseModel {
  @ApiProperty({ description: "User ID", example: "63f6e5ad4e5f4a6b97a5c1a2" })
  @IsString()
  id: string;

  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
  })
  @Transform(({ obj }) => obj.email.toLowerCase())
  @IsEmail()
  email: string;

  @ApiProperty({ description: "First name of the user", example: "John" })
  @IsString()
  firstName: string;

  @ApiProperty({ description: "Last name of the user", example: "Doe" })
  @IsString()
  lastName: string;

  @ApiProperty({ description: "Status of the user", example: "active" })
  @IsEnum(UserStatus)
  status: UserStatus;

  @ApiProperty({
    description: "Roles assigned to the user",
    example: ["admin", "editor"],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  roles: string[];

  @ApiProperty({
    description: "Permissions granted to the user",
    example: ["read:articles", "write:articles"],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @ApiProperty({
    description: "Consents given by the user",
    type: [UserConsentDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserConsentDto)
  consents?: UserConsentDto[];

  @ApiProperty({
    description: "Creation date of the user",
    example: "2011-10-05T14:48:00.000Z",
  })
  @IsDateString()
  createdAt: string;

  @ApiProperty({
    description: "Update date of the user",
    example: "2011-10-05T14:48:00.000Z",
  })
  @IsDateString()
  updatedAt: string;

  @Exclude()
  password: string;

  @Exclude()
  _id: ObjectId;

  @Exclude()
  __v: string;

  @Exclude()
  loginAttempts: string;

  constructor(partial: Partial<UserResponseDto | UserResponseModel>) {
    Object.assign(this, partial);
  }
}
