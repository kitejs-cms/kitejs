import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export type StorageItemType = "file" | "directory";

export class StorageItemDto {
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
    description: "Child items (only for directories)",
    type: [StorageItemDto],
    required: false,
  })
  @Type(() => StorageItemDto)
  children?: StorageItemDto[];
  constructor(partial: Partial<StorageItemDto>) {
    Object.assign(this, partial);
  }
}
