import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from "class-validator";

export class CreateCustomerAddressDto {
  @ApiProperty({ description: "Identifier of the customer (core user)" })
  @IsMongoId()
  userId!: string;

  @ApiProperty({ required: false, description: "Label for the address" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  company?: string;

  @ApiProperty({ description: "Primary address line" })
  @IsString()
  @Length(1, 255)
  address1!: string;

  @ApiProperty({ required: false, description: "Secondary address line" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address2?: string;

  @ApiProperty({ description: "City" })
  @IsString()
  @Length(1, 120)
  city!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  province?: string;

  @ApiProperty({ description: "ISO country code" })
  @IsString()
  @Length(2, 2)
  countryCode!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isDefaultShipping?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isDefaultBilling?: boolean;
}
