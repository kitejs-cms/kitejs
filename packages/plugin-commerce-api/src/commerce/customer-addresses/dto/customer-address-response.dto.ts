import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDate,
  IsMongoId,
  IsOptional,
  IsString,
} from "class-validator";

import type { CustomerAddressResponseModel } from "../models/customer-address-response.model";

export class CustomerAddressResponseDto
  implements CustomerAddressResponseModel
{
  @ApiProperty()
  @IsMongoId()
  id: string;

  @ApiProperty({ description: "Identifier of the customer (core user)" })
  @IsMongoId()
  userId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;

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

  @ApiProperty()
  @IsBoolean()
  isDefaultShipping: boolean;

  @ApiProperty()
  @IsBoolean()
  isDefaultBilling: boolean;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  createdAt: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  updatedAt: Date;

  constructor(partial: CustomerAddressResponseModel) {
    Object.assign(this, partial);
  }
}
