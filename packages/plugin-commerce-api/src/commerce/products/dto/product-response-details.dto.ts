import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Type } from "class-transformer";
import type { ProductResponseDetailsModel } from "../models/product-response-details.model";
import type { ProductTranslationModel } from "../models/partials/product-translation.model";
import { ProductOptionModel } from "../models/partials/product-option.model";
import { ProductStatus } from "../models/product-status.enum";
import { ProductVariant } from "../schemas/product-variant.schema";
import { ProductOptionDto } from "./partials/product-option.dto";
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";
import { ProductVariantDto } from "./partials/product-variant.dto";

export class ProductResponseDetailsDto implements ProductResponseDetailsModel {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ type: Object })
  @IsObject()
  slugs: Record<string, string>;

  @ApiProperty({
    type: Object,
    example: {
      en: {
        name: "Leather Wallet",
        summary: "High-quality handmade leather wallet.",
        description: "Premium wallet",
        slug: "Buy the best handmade leather wallet online.",
        seo: {
          metaTitle: "Classic Leather Wallet | Handmade",
          metaDescription:
            "Slim handmade leather wallet in premium full-grain leather. Ships in EU.",
          metaKeywords: ["wallet", "leather", "handmade"],
        },
      },
    },
  })
  @IsObject()
  translations: Record<string, ProductTranslationModel>;

  @ApiProperty({ enum: ProductStatus })
  @IsEnum(ProductStatus)
  status: ProductStatus;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsBoolean()
  isDigital: boolean;

  @ApiProperty({ type: [ProductVariantDto] })
  @IsArray()
  @Type(() => ProductVariantDto)
  variants: ProductVariant[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  collections: string[];

  @ApiProperty({ type: [ProductOptionDto] })
  @IsArray()
  @Type(() => ProductOptionDto)
  options: ProductOptionModel[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  gallery: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expireAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiProperty()
  @IsString()
  createdBy: string;

  @ApiProperty()
  @IsString()
  updatedBy: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  createdAt: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  updatedAt: Date;

  @Exclude()
  _id: string;

  @Exclude()
  __v: string;

  constructor(partial: ProductResponseDetailsModel) {
    Object.assign(this, partial);
  }
}
