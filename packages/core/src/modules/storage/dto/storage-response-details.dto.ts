import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Exclude, Type } from "class-transformer";
import type { StorageResponseDetailsModel } from "../models/storage-response-details.model";
import type { StorageItemType } from "../models/storage-response.model";
import {
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
  ValidateNested,
} from "class-validator";

/**
 * DTO representing a detailed storage item (file or directory),
 * including metadata and localized fields.
 */
export class StorageResponseDetailsDto implements StorageResponseDetailsModel {
  @ApiPropertyOptional({
    description: "Unique identifier of the storage item when persisted.",
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: "Name of the file or directory.",
    example: "hero-banner.jpg",
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "Full path of the item within the storage system.",
    example: "/uploads/images/hero-banner.jpg",
  })
  @IsString()
  path: string;

  @ApiProperty({
    description: "Type of the storage item ('file' or 'directory').",
    enum: ["file", "directory"],
  })
  @IsString()
  type: StorageItemType;

  @ApiPropertyOptional({
    description: "Direct or signed URL to access the file (only for files).",
    example: "https://cdn.example.com/uploads/images/hero-banner.jpg",
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({
    description: "Alternative text for accessibility and SEO (localized).",
    example: { en: "Hero banner image", it: "Immagine banner principale" },
  })
  @IsOptional()
  @IsObject()
  alt?: Record<string, string>;

  @ApiPropertyOptional({
    description: "Title text for the file (localized).",
    example: { en: "Homepage Hero Banner", it: "Banner Principale Home" },
  })
  @IsOptional()
  @IsObject()
  title?: Record<string, string>;

  @ApiPropertyOptional({
    description: "Detailed description for SEO or Open Graph (localized).",
    example: {
      en: "Banner used in the homepage hero section",
      it: "Banner utilizzato nella sezione hero della home page",
    },
  })
  @IsOptional()
  @IsObject()
  description?: Record<string, string>;

  @ApiPropertyOptional({
    description: "MIME type of the file.",
    example: "image/jpeg",
  })
  @IsOptional()
  @IsString()
  mediaType?: string;

  @ApiPropertyOptional({
    description: "File size in bytes.",
    example: 245678,
  })
  @IsOptional()
  @IsNumber()
  size?: number;

  @ApiPropertyOptional({
    description: "File dimensions if applicable (for images).",
    example: { width: 1920, height: 1080 },
  })
  @IsOptional()
  @IsObject()
  dimensions?: { width?: number; height?: number };

  @ApiPropertyOptional({
    description: "Date when the file was created (ISO string).",
    example: "2025-10-26T12:34:56.789Z",
  })
  @IsOptional()
  @IsString()
  createdAt?: string;

  @ApiPropertyOptional({
    description: "Date when the file was last updated (ISO string).",
    example: "2025-10-27T08:15:42.123Z",
  })
  @IsOptional()
  @IsString()
  updatedAt?: string;

  @ApiPropertyOptional({
    description: "Child items if the current item is a directory.",
    type: () => [StorageResponseDetailsDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => StorageResponseDetailsDto)
  children?: StorageResponseDetailsModel[];

  @Exclude()
  _id: string;

  @Exclude()
  __v: number;

  constructor(partial: Partial<StorageResponseDetailsDto>) {
    Object.assign(this, partial);
  }
}
