import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { ProductStatus } from "../models/product-status.enum";
import {
  ProductBaseModel,
  ProductPriceModel,
  ProductSeoModel,
  ProductVariantModel,
} from "../models/product.models";

export class ProductSeoDto extends ProductSeoModel {
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

export class ProductPriceDto extends ProductPriceModel {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  declare currencyCode: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  declare amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  declare compareAtAmount?: number;
}

export class ProductVariantDto extends ProductVariantModel {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare id?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  declare title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  declare sku: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare barcode?: string;

  @ApiPropertyOptional({ type: () => [ProductPriceDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductPriceDto)
  declare prices?: ProductPriceDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  declare inventoryQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  declare allowBackorder?: boolean;
}

export class CreateProductDto extends ProductBaseModel {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  declare slug: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  declare language: string;

  @ApiProperty({ enum: ProductStatus })
  @IsEnum(ProductStatus)
  declare status: ProductStatus;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  declare title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare subtitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare description?: string;

  @ApiPropertyOptional({ type: () => ProductSeoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductSeoDto)
  declare seo?: ProductSeoDto;

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
  declare thumbnail?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  declare gallery?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  declare collectionIds?: string[];

  @ApiPropertyOptional({ type: () => [ProductVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  declare variants?: ProductVariantDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare defaultCurrency?: string;
}
