import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { IsArray, IsInt, IsString } from "class-validator";
import { ObjectId } from "mongoose";
import { RoleResponseModel } from "../models/role-response.model";

export class RoleResponseDto implements RoleResponseModel {
  @ApiProperty({ description: "Role ID" })
  @IsString()
  id: string;

  @ApiProperty({ description: "Role name" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Role description" })
  @IsString()
  description: string;

  @ApiProperty({ description: "Permissions associated with the role", type: [String] })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @ApiProperty({ description: "Source of the role", enum: ["system", "user"] })
  @IsString()
  source: "system" | "user";

  @ApiProperty({ description: "Number of users assigned to this role" })
  @IsInt()
  usersCount: number;

  @Exclude()
  _id: ObjectId;

  @Exclude()
  __v: number;

  constructor(partial: Partial<RoleResponseDto | RoleResponseModel>) {
    Object.assign(this, partial);
  }
}
