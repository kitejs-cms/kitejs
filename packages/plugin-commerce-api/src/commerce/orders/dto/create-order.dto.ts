import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { OrderStatus } from "../models/order-status.enum";
import { PaymentStatus } from "../models/payment-status.enum";
import { FulfillmentStatus } from "../models/fulfillment-status.enum";
import type {
  OrderAddressModel,
  OrderBaseModel,
  OrderItemModel,
} from "../models/order.models";

export class OrderAddressDto implements OrderAddressModel {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare company?: string;

  @ApiProperty()
  @IsString()
  declare address1: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare address2?: string;

  @ApiProperty()
  @IsString()
  declare city: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare province?: string;

  @ApiProperty()
  @IsString()
  declare countryCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare phone?: string;
}

export class OrderItemDto implements OrderItemModel {
  @ApiProperty()
  @IsString()
  declare title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare variantTitle?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  declare quantity: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  declare unitPrice: number;

  @ApiProperty()
  @IsString()
  declare currencyCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare variantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare sku?: string;
}

export class CreateOrderDto implements OrderBaseModel {
  @ApiProperty()
  @IsString()
  declare orderNumber: string;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  declare status?: OrderStatus;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  declare paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ enum: FulfillmentStatus })
  @IsOptional()
  @IsEnum(FulfillmentStatus)
  declare fulfillmentStatus?: FulfillmentStatus;

  @ApiProperty()
  @IsString()
  declare currencyCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  declare email?: string;

  @ApiPropertyOptional({ type: () => OrderAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrderAddressDto)
  declare billingAddress?: OrderAddressDto;

  @ApiPropertyOptional({ type: () => OrderAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrderAddressDto)
  declare shippingAddress?: OrderAddressDto;

  @ApiProperty({ type: () => [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  declare items: OrderItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  declare shippingTotal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  declare taxTotal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  declare discountTotal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare notes?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  declare tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  declare paidAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  declare fulfilledAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  declare cancelledAt?: string;
}
