import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

export class CollectionSeoDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateCollectionDto {
  @IsString()
  title!: string;

  @IsString()
  handle!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CollectionSeoDto)
  seo?: CollectionSeoDto;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
