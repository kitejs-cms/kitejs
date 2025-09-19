import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";

import { OrderAddressDto } from "./order-address.dto";
import { OrderItemResponseDto } from "./order-item-response.dto";
import { FulfillmentStatus } from "../models/fulfillment-status.enum";
import { OrderStatus } from "../models/order-status.enum";
import { PaymentStatus } from "../models/payment-status.enum";
import type { OrderResponseModel } from "../models/order-response.model";

export class OrderResponseDto implements OrderResponseModel {
  @ApiProperty()
  @IsMongoId()
  id: string;

  @ApiProperty()
  @IsString()
  orderNumber: string;

  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;

  @ApiProperty({ enum: FulfillmentStatus })
  @IsEnum(FulfillmentStatus)
  fulfillmentStatus: FulfillmentStatus;

  @ApiProperty()
  @IsString()
  currencyCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  customerId?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  customer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ type: () => OrderAddressDto })
  @IsOptional()
  @Type(() => OrderAddressDto)
  billingAddress?: OrderAddressDto;

  @ApiPropertyOptional({ type: () => OrderAddressDto })
  @IsOptional()
  @Type(() => OrderAddressDto)
  shippingAddress?: OrderAddressDto;

  @ApiProperty({ type: () => [OrderItemResponseDto] })
  @IsArray()
  @Type(() => OrderItemResponseDto)
  items: OrderItemResponseDto[];

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  subtotal: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  shippingTotal: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  taxTotal: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  discountTotal: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  total: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  paidAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fulfilledAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  cancelledAt?: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  createdAt: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  updatedAt: Date;

  constructor(model: OrderResponseModel) {
    Object.assign(this, model);
  }
}
