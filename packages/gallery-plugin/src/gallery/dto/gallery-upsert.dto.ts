import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { GalleryStatus } from "../models/gallery-status.enum";
import { GallerySeoModel } from "../models/gallery-seo.model";
import { GalleryItemModel } from "../models/gallery-item.model";

export class GalleryItemDto implements GalleryItemModel {
  @ApiProperty({ description: "Asset ID", example: "60f7c0a2d3a8f009e6f0b7d1" })
  @IsMongoId()
  assetId: string;

  @ApiPropertyOptional({ description: "Order of the item", example: 0 })
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ description: "Caption for the item" })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ description: "Alternate text override" })
  @IsOptional()
  @IsString()
  altOverride?: string;

  @ApiPropertyOptional({ description: "Link URL" })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional({ enum: ["visible", "hidden"], default: "visible" })
  @IsOptional()
  @IsIn(["visible", "hidden"])
  visibility?: "visible" | "hidden";

  constructor(partial: Partial<GalleryItemDto>) {
    Object.assign(this, partial);
  }
}

export class GallerySeoDto implements GallerySeoModel {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaTitle: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaDescription: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metaKeywords?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  canonical?: string;

  constructor(partial: Partial<GallerySeoDto>) {
    Object.assign(this, partial);
  }
}

export class GalleryUpsertDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  language: string;

  @ApiProperty({ enum: GalleryStatus })
  @IsNotEmpty()
  @IsEnum(GalleryStatus)
  status: GalleryStatus;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  publishAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expireAt?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [GalleryItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GalleryItemDto)
  items?: GalleryItemDto[];

  @ApiPropertyOptional({ type: GallerySeoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GallerySeoDto)
  seo?: GallerySeoDto;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  categories?: string[];

  constructor(partial: Partial<GalleryUpsertDto>) {
    Object.assign(this, partial);
  }
}

