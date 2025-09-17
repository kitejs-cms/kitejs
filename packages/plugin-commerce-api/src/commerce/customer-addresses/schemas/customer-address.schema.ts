import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaDb, Types } from "mongoose";
import { User } from "@kitejs-cms/core";
import { COMMERCE_PLUGIN_NAMESPACE } from "../../../constants";

@Schema({
  collection: `${COMMERCE_PLUGIN_NAMESPACE}_customer_addresses`,
  timestamps: true,
  toJSON: { getters: true },
})
export class CustomerAddress extends Document {
  @Prop({ type: SchemaDb.ObjectId, ref: User.name, required: true, index: true })
  userId!: Types.ObjectId;

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

CustomerAddressSchema.index({ userId: 1, isDefaultShipping: 1 });
CustomerAddressSchema.index({ userId: 1, isDefaultBilling: 1 });

export type CustomerAddressDocument = CustomerAddress & Document;
