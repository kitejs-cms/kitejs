import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import {
  IsBoolean,
  IsDate,
  IsOptional,
  IsString,
  IsArray,
  IsEnum,
  IsNotEmpty,
} from "class-validator";
import { ObjectId } from "mongoose";
import {
  PluginResponseModel,
  PluginStatus,
} from "../models/plugin-response.model";

export class PluginResponseDto implements PluginResponseModel {
  @ApiProperty({
    description: "Unique identifier of the plugin",
    example: "60f7c0a2d3a8f009e6f0b7d1",
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: "Name plugin" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Unique namespace of the plugin" })
  @IsString()
  namespace: string;

  @ApiProperty({
    description: "Status of plugin",
    enum: PluginStatus,
  })
  @IsEnum(PluginStatus)
  status: PluginStatus;

  @ApiProperty({
    description: "Plugin type: official (npm) or custom (filesystem)",
  })
  @IsString()
  type: "official" | "custom";

  @ApiProperty({
    description: "Path where the plugin is located (for custom plugins)",
    required: false,
  })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiProperty({ description: "Plugin version" })
  @IsString()
  version: string;

  @ApiProperty({ description: "Indicates whether the plugin is enabled" })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ description: "True if disablement is pending a restart" })
  @IsBoolean()
  pendingDisable: boolean;

  @ApiProperty({ description: "Date when the plugin was installed" })
  @IsDate()
  installedAt: Date;

  @ApiProperty({ description: "Last update date of the plugin" })
  @IsDate()
  updatedAt: Date;

  @ApiProperty({ description: "Author of the plugin", required: false })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiProperty({ description: "Description of the plugin", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "List of dependencies required by the plugin",
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  dependencies: string[];

  @IsOptional()
  @IsString()
  lastError: string | null;

  @Exclude()
  __v: number;

  @Exclude()
  _id: ObjectId;

  constructor(plugin: PluginResponseDto | PluginResponseModel) {
    Object.assign(this, plugin);
  }
}
