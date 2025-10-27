import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Type } from "class-transformer";
import {
  StorageItemType,
  StorageResponseModel,
} from "../models/storage-response.model";

export class StorageResponseDto implements StorageResponseModel {
  @ApiProperty({ description: "Name of the file or directory" })
  name: string;

  @ApiProperty({ description: "Full path of the item" })
  path: string;

  @ApiProperty({ description: "Type of the item", enum: ["file", "directory"] })
  type: StorageItemType;

  @ApiProperty({
    description: "URL to access the file (only for files)",
    required: false,
  })
  url?: string;

  @ApiProperty({
    description: "Alt text for the file (only for files)",
    required: false,
  })
  alt?: string;

  @ApiProperty({
    description: "Description of the file",
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: "Title of the file",
    required: false,
  })
  title?: string;

  @ApiProperty({
    description: "Child items (only for directories)",
    type: [StorageResponseDto],
    required: false,
  })
  @Type(() => StorageResponseDto)
  children?: StorageResponseDto[];

  @Exclude()
  _id: string;

  @Exclude()
  __v: number;

  constructor(partial: Partial<StorageResponseDto>) {
    Object.assign(this, partial);
  }
}
