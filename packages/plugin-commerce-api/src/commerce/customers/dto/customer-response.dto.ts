import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from "class-validator";
import { UserResponseDto } from "@kitejs-cms/core";

export class CustomerAddressResponseDto {
  @ApiProperty({ description: "Address ID", example: "64f6e5ad4e5f4a6b97a5c1a2" })
  @IsString()
  id!: string;

  @ApiProperty({ description: "Label for the address", required: false })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({ description: "First name", required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ description: "Last name", required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ description: "Company name", required: false })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({ description: "Address line 1" })
  @IsString()
  address1!: string;

  @ApiProperty({ description: "Address line 2", required: false })
  @IsOptional()
  @IsString()
  address2?: string;

  @ApiProperty({ description: "City" })
  @IsString()
  city!: string;

  @ApiProperty({ description: "Postal code", required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ description: "Province", required: false })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({ description: "Country ISO code" })
  @IsString()
  countryCode!: string;

  @ApiProperty({ description: "Phone number", required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: "Whether this is the default shipping address" })
  @IsBoolean()
  isDefaultShipping!: boolean;

  @ApiProperty({ description: "Whether this is the default billing address" })
  @IsBoolean()
  isDefaultBilling!: boolean;
}

export class CustomerResponseDto extends UserResponseDto {
  @ApiProperty({ type: [CustomerAddressResponseDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerAddressResponseDto)
  addresses: CustomerAddressResponseDto[];

  constructor(partial: Partial<CustomerResponseDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
