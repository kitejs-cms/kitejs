import { ApiProperty } from "@nestjs/swagger";
import { CustomerAddress } from "../schemas/customer-address.schema";
import type { CustomerAddressResponseModel } from "../models/customer-address.model";

export class CustomerAddressResponseDto
  implements CustomerAddressResponseModel
{
  @ApiProperty()
  id: string;

  @ApiProperty({ description: "Identifier of the customer (core user)" })
  userId: string;

  @ApiProperty({ required: false })
  label?: string;

  @ApiProperty({ required: false })
  firstName?: string;

  @ApiProperty({ required: false })
  lastName?: string;

  @ApiProperty({ required: false })
  company?: string;

  @ApiProperty()
  address1: string;

  @ApiProperty({ required: false })
  address2?: string;

  @ApiProperty()
  city: string;

  @ApiProperty({ required: false })
  postalCode?: string;

  @ApiProperty({ required: false })
  province?: string;

  @ApiProperty()
  countryCode: string;

  @ApiProperty({ required: false })
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
