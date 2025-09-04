import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { IsString } from "class-validator";
import { ObjectId } from "mongoose";
import { PermissionResponseModel } from "../models/permission-response.model";

export class PermissionResponseDto implements PermissionResponseModel {
  @ApiProperty({ description: "Permission ID" })
  @IsString()
  id: string;

  @ApiProperty({ description: "Permission name" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Permission description" })
  @IsString()
  description: string;

  @ApiProperty({ description: "Permission namespace" })
  @IsString()
  namespace: string;

  @Exclude()
  _id: ObjectId;

  @Exclude()
  __v: number;

  constructor(partial: Partial<PermissionResponseDto | PermissionResponseModel>) {
    Object.assign(this, partial);
  }
}
