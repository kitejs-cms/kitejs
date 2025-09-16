import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { InventoryPolicy } from "../models/inventory-policy.enum";
import { ProductStatus } from "../models/product-status.enum";

export class MoneyAmountDto {
  @IsString()
  currencyCode!: string;

  @Type(() => Number)
  @IsNumber()
  amount!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  compareAtAmount?: number;
}

export class ProductOptionDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  values?: string[];
}

export class ProductVariantOptionDto {
  @IsString()
  name!: string;

  @IsString()
  value!: string;
}

export class DimensionsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  length?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  width?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  height?: number;
}

export class ProductVariantDto {
  @IsString()
  title!: string;

  @IsString()
  sku!: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MoneyAmountDto)
  prices?: MoneyAmountDto[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  inventoryQuantity?: number;

  @IsOptional()
  @IsEnum(InventoryPolicy)
  inventoryPolicy?: InventoryPolicy;

  @IsOptional()
  @IsBoolean()
  manageInventory?: boolean;

  @IsOptional()
  @IsBoolean()
  allowBackorder?: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantOptionDto)
  options?: ProductVariantOptionDto[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  weight?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => DimensionsDto)
  dimensions?: DimensionsDto;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateProductDto {
  @IsString()
  title!: string;

  @IsString()
  handle!: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  collectionIds?: string[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductOptionDto)
  options?: ProductOptionDto[];

  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants!: ProductVariantDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MoneyAmountDto)
  pricing?: MoneyAmountDto[];

  @IsOptional()
  @IsBoolean()
  isGiftCard?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
