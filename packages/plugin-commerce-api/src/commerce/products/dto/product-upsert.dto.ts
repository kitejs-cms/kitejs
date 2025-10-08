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

import { ProductStatus } from "../models/product-status.enum";
import { ProductVariantDto } from "./partials/product-variant.dto";
import { ProductSeoDto } from "./partials/product-seo.dto";
import type { ProductUpsertModel } from "../models/product-upsert.model";

export class ProductUpsertDto implements ProductUpsertModel {
  @IsMongoId()
  @IsOptional()
  @ApiPropertyOptional()
  id?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  language: string;

  @ApiProperty({ enum: ProductStatus })
  @IsEnum(ProductStatus)
  status: ProductStatus;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: () => ProductSeoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductSeoDto)
  seo?: ProductSeoDto;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gallery?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  collectionIds?: string[];

  @ApiPropertyOptional({ type: () => [ProductVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultCurrency?: string;

  constructor(partial: ProductUpsertModel) {
    Object.assign(this, partial);
  }
}
