import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

import type { OrderItemResponseModel } from "../models/order-item-response.model";

export class OrderItemResponseDto implements OrderItemResponseModel {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

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

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  total: number;

  constructor(partial: OrderItemResponseModel) {
    Object.assign(this, partial);
  }
}
