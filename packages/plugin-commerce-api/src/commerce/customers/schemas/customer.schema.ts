import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaDb, Types } from "mongoose";
import { CustomerLifecycleStage } from "../models/customer-lifecycle-stage.enum";
import { COMMERCE_PLUGIN_NAMESPACE } from "../../../constants";

@Schema({ _id: true })
export class CustomerAddress {
  @Prop({ type: String })
  label?: string;

  @Prop({ type: String })
  firstName?: string;

  @Prop({ type: String })
  lastName?: string;

  @Prop({ type: String })
  company?: string;

  @Prop({ type: String, required: true })
  address1!: string;

  @Prop({ type: String })
  address2?: string;

  @Prop({ type: String, required: true })
  city!: string;

  @Prop({ type: String })
  postalCode?: string;

  @Prop({ type: String })
  province?: string;

  @Prop({ type: String, required: true })
  countryCode!: string;

  @Prop({ type: String })
  phone?: string;

  @Prop({ type: Boolean, default: false })
  isDefaultShipping!: boolean;

  @Prop({ type: Boolean, default: false })
  isDefaultBilling!: boolean;
}

export const CustomerAddressSchema =
  SchemaFactory.createForClass(CustomerAddress);

@Schema({
  collection: `${COMMERCE_PLUGIN_NAMESPACE}_customers`,
  timestamps: true,
  toJSON: { getters: true },
})
export class Customer extends Document {
  @Prop({ type: String, required: true, unique: true, index: true })
  email!: string;

  @Prop({ type: String })
  firstName?: string;

  @Prop({ type: String })
  lastName?: string;

  @Prop({ type: String })
  phone?: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: String })
  notes?: string;

  @Prop({
    type: String,
    enum: CustomerLifecycleStage,
    default: CustomerLifecycleStage.Lead,
  })
  lifecycleStage!: CustomerLifecycleStage;

  @Prop({ type: [CustomerAddressSchema], default: [] })
  addresses!: CustomerAddress[];

  @Prop({ type: SchemaDb.ObjectId })
  defaultShippingAddressId?: Types.ObjectId;

  @Prop({ type: SchemaDb.ObjectId })
  defaultBillingAddressId?: Types.ObjectId;

  @Prop({ type: Date })
  lastOrderAt?: Date;

  @Prop({
    type: SchemaDb.Types.Map,
    of: SchemaDb.Types.Mixed,
    default: {},
  })
  metadata?: Map<string, any>;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

CustomerSchema.index({ lifecycleStage: 1, createdAt: -1 });

export type CustomerDocument = Customer & Document;
