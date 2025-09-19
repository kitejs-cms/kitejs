import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsString, IsOptional, IsNumber, IsMongoId } from "class-validator";
import type { OrderItemModel } from "../models/order-item.model";

export class OrderItemDto implements OrderItemModel {
  @IsMongoId()
  @ApiProperty()
  id: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  variantTitle?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  unitPrice: number;

  @ApiProperty()
  @IsString()
  currencyCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  constructor(partial: OrderItemModel) {
    Object.assign(this, partial);
  }
}
