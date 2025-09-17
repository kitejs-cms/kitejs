import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ _id: true })
export class CustomerAddress {
  @Prop({ type: String, required: false })
  label?: string;

  @Prop({ type: String, required: false })
  firstName?: string;

  @Prop({ type: String, required: false })
  lastName?: string;

  @Prop({ type: String, required: false })
  company?: string;

  @Prop({ type: String, required: true })
  address1!: string;

  @Prop({ type: String, required: false })
  address2?: string;

  @Prop({ type: String, required: true })
  city!: string;

  @Prop({ type: String, required: false })
  postalCode?: string;

  @Prop({ type: String, required: false })
  province?: string;

  @Prop({ type: String, required: true })
  countryCode!: string;

  @Prop({ type: String, required: false })
  phone?: string;

  @Prop({ type: Boolean, default: false })
  isDefaultShipping: boolean;

  @Prop({ type: Boolean, default: false })
  isDefaultBilling: boolean;
}

export const CustomerAddressSchema =
  SchemaFactory.createForClass(CustomerAddress);
