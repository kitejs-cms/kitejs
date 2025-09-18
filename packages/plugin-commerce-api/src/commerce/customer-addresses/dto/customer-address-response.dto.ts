import { ApiProperty } from "@nestjs/swagger";
import { CustomerAddress } from "../schemas/customer-address.schema";
import type { CustomerAddressResponseModel } from "../models/customer-address.model";

export class CustomerAddressResponseDto implements CustomerAddressResponseModel {
  @ApiProperty()
  declare id: string;

  @ApiProperty({ description: "Identifier of the customer (core user)" })
  declare userId: string;

  @ApiProperty({ required: false })
  declare label?: string;

  @ApiProperty({ required: false })
  declare firstName?: string;

  @ApiProperty({ required: false })
  declare lastName?: string;

  @ApiProperty({ required: false })
  declare company?: string;

  @ApiProperty()
  declare address1: string;

  @ApiProperty({ required: false })
  declare address2?: string;

  @ApiProperty()
  declare city: string;

  @ApiProperty({ required: false })
  declare postalCode?: string;

  @ApiProperty({ required: false })
  declare province?: string;

  @ApiProperty()
  declare countryCode: string;

  @ApiProperty({ required: false })
  declare phone?: string;

  @ApiProperty()
  declare isDefaultShipping: boolean;

  @ApiProperty()
  declare isDefaultBilling: boolean;

  @ApiProperty()
  declare createdAt: Date;

  @ApiProperty()
  declare updatedAt: Date;

  constructor(entity: CustomerAddress) {
    Object.assign(this, {
      id: entity._id.toString(),
      userId: entity.userId.toString(),
      label: entity.label,
      firstName: entity.firstName,
      lastName: entity.lastName,
      company: entity.company,
      address1: entity.address1,
      address2: entity.address2,
      city: entity.city,
      postalCode: entity.postalCode,
      province: entity.province,
      countryCode: entity.countryCode,
      phone: entity.phone,
      isDefaultShipping: entity.isDefaultShipping,
      isDefaultBilling: entity.isDefaultBilling,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
