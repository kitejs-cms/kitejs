import { ApiProperty } from "@nestjs/swagger";
import { CustomerAddress } from "../schemas/customer-address.schema";

export class CustomerAddressResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: "Identifier of the customer (core user)" })
  userId!: string;

  @ApiProperty({ required: false })
  label?: string;

  @ApiProperty({ required: false })
  firstName?: string;

  @ApiProperty({ required: false })
  lastName?: string;

  @ApiProperty({ required: false })
  company?: string;

  @ApiProperty()
  address1!: string;

  @ApiProperty({ required: false })
  address2?: string;

  @ApiProperty()
  city!: string;

  @ApiProperty({ required: false })
  postalCode?: string;

  @ApiProperty({ required: false })
  province?: string;

  @ApiProperty()
  countryCode!: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty()
  isDefaultShipping!: boolean;

  @ApiProperty()
  isDefaultBilling!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  constructor(entity: CustomerAddress) {
    this.id = entity._id.toString();
    this.userId = entity.userId.toString();
    this.label = entity.label;
    this.firstName = entity.firstName;
    this.lastName = entity.lastName;
    this.company = entity.company;
    this.address1 = entity.address1;
    this.address2 = entity.address2;
    this.city = entity.city;
    this.postalCode = entity.postalCode;
    this.province = entity.province;
    this.countryCode = entity.countryCode;
    this.phone = entity.phone;
    this.isDefaultShipping = entity.isDefaultShipping;
    this.isDefaultBilling = entity.isDefaultBilling;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
  }
}
