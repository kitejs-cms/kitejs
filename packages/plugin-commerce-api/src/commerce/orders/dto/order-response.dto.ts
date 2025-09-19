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
import type { OrderResponseModel } from "../models/order-response.model";
import { OrderStatus } from "../models/order-status.enum";
import { PaymentStatus } from "../models/payment-status.enum";

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
  customer?: Record<string, unknown>;

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
    this.id = model.id;
    this.orderNumber = model.orderNumber;
    this.status = model.status;
    this.paymentStatus = model.paymentStatus;
    this.fulfillmentStatus = model.fulfillmentStatus;
    this.currencyCode = model.currencyCode;
    this.customerId = model.customerId;
    this.customer = model.customer;
    this.email = model.email;
    this.billingAddress = model.billingAddress
      ? new OrderAddressDto(model.billingAddress)
      : undefined;
    this.shippingAddress = model.shippingAddress
      ? new OrderAddressDto(model.shippingAddress)
      : undefined;
    this.items = model.items.map((item) => new OrderItemResponseDto(item));
    this.subtotal = model.subtotal;
    this.shippingTotal = model.shippingTotal;
    this.taxTotal = model.taxTotal;
    this.discountTotal = model.discountTotal;
    this.total = model.total;
    this.notes = model.notes;
    this.tags = model.tags;
    this.paidAt = model.paidAt;
    this.fulfilledAt = model.fulfilledAt;
    this.cancelledAt = model.cancelledAt;
    this.createdAt = model.createdAt;
    this.updatedAt = model.updatedAt;
  }
}
