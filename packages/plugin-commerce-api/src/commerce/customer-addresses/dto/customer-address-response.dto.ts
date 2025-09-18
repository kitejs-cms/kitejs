import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CustomerAddress } from "../schemas/customer-address.schema";
import type { CustomerAddressResponseModel } from "../models/customer-address-response.model";

export class CustomerAddressResponseDto
  implements CustomerAddressResponseModel
{
  @ApiProperty()
  id: string;

  @ApiProperty({ description: "Identifier of the customer (core user)" })
  userId: string;

  @ApiPropertyOptional()
  label?: string;

  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional()
  lastName?: string;

  @ApiPropertyOptional()
  company?: string;

  @ApiProperty()
  address1: string;

  @ApiPropertyOptional()
  address2?: string;

  @ApiProperty()
  city: string;

  @ApiPropertyOptional()
  postalCode?: string;

  @ApiPropertyOptional()
  province?: string;

  @ApiProperty()
  countryCode: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiProperty()
  isDefaultShipping: boolean;

  @ApiProperty()
  isDefaultBilling: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: CustomerAddress) {
    Object.assign(this, partial);
  }
}
