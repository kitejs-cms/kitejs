import type { CustomerAddressBaseModel } from "../models/customer-address.model";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from "class-validator";

export class CreateCustomerAddressDto implements CustomerAddressBaseModel {
  @ApiProperty({ description: "Identifier of the customer (core user)" })
  @IsMongoId()
  userId: string;

  @ApiPropertyOptional({ description: "Label for the address" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  company?: string;

  @ApiProperty({ description: "Primary address line" })
  @IsString()
  @Length(1, 255)
  address1: string;

  @ApiPropertyOptional({ description: "Secondary address line" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address2?: string;

  @ApiProperty({ description: "City" })
  @IsString()
  @Length(1, 120)
  city: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  province?: string;

  @ApiProperty({ description: "ISO country code" })
  @IsString()
  @Length(2, 2)
  countryCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefaultShipping?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefaultBilling?: boolean;

  constructor(partial: CreateCustomerAddressDto) {
    Object.assign(partial);
  }
}
