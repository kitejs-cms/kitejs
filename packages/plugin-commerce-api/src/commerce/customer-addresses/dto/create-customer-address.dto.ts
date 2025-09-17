import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from "class-validator";
import { CustomerAddressBaseModel } from "../models/customer-address.model";

export class CreateCustomerAddressDto extends CustomerAddressBaseModel {
  @ApiProperty({ description: "Identifier of the customer (core user)" })
  @IsMongoId()
  declare userId: string;

  @ApiPropertyOptional({ description: "Label for the address" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  declare label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  declare firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  declare lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  declare company?: string;

  @ApiProperty({ description: "Primary address line" })
  @IsString()
  @Length(1, 255)
  declare address1: string;

  @ApiPropertyOptional({ description: "Secondary address line" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  declare address2?: string;

  @ApiProperty({ description: "City" })
  @IsString()
  @Length(1, 120)
  declare city: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  declare postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  declare province?: string;

  @ApiProperty({ description: "ISO country code" })
  @IsString()
  @Length(2, 2)
  declare countryCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  declare phone?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  declare isDefaultShipping?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  declare isDefaultBilling?: boolean;
}
