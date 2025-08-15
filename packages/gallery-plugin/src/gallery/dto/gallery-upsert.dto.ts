import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { GalleryStatus } from "../models/gallery-status.enum";
import { GalleryItemDto } from "./gallery-item.dto";
import { GallerySeoDto } from "./gallery-seo.dto";

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
