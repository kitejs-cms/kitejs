import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { CollectionStatus } from "../models/collection-status.enum";
import type {
  CollectionBaseModel,
  CollectionSeoModel,
} from "../models/collection.models";

export class CollectionSeoDto implements CollectionSeoModel {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare metaTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare metaDescription?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  declare metaKeywords?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare canonicalUrl?: string;
}

export class CreateCollectionDto implements CollectionBaseModel {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  declare slug: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  declare language: string;

  @ApiProperty({ enum: CollectionStatus })
  @IsEnum(CollectionStatus)
  declare status: CollectionStatus;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  declare title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare description?: string;

  @ApiPropertyOptional({ type: () => CollectionSeoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CollectionSeoDto)
  declare seo?: CollectionSeoDto;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  declare tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  declare publishAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  declare expireAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare coverImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  declare sortOrder?: number;
}
