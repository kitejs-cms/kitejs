import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import type { OrderAddressModel } from "../models/order-address.model";

export class OrderAddressDto implements OrderAddressModel {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty()
  @IsString()
  address1: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address2?: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty()
  @IsString()
  countryCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  constructor(partial: OrderAddressModel) {
    Object.assign(this, partial);
  }
}
