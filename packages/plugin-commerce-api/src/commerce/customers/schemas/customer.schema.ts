import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaDb, Types } from "mongoose";
import { CustomerLifecycleStage } from "../models/customer-lifecycle-stage.enum";
import { COMMERCE_PLUGIN_NAMESPACE } from "../../../constants";
import {
  CustomerAddress,
  CustomerAddressSchema,
} from "./customer-address.schema";

@Schema({
  collection: `${COMMERCE_PLUGIN_NAMESPACE}_customers`,
  timestamps: true,
  toJSON: { getters: true },
})
export class Customer extends Document {
  @Prop({ type: String, required: true, unique: true, index: true })
  email!: string;

  @Prop({ type: String, required: false })
  firstName?: string;

  @Prop({ type: String, required: false })
  lastName?: string;

  @Prop({ type: String, required: false })
  phone?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: String, required: false })
  notes?: string;

  @Prop({
    type: String,
    enum: CustomerLifecycleStage,
    default: CustomerLifecycleStage.Lead,
  })
  lifecycleStage: CustomerLifecycleStage;

  @Prop({ type: [CustomerAddressSchema], default: [] })
  addresses: CustomerAddress[];

  @Prop({ type: SchemaDb.ObjectId, required: false })
  defaultShippingAddressId?: Types.ObjectId;

  @Prop({ type: SchemaDb.ObjectId, required: false })
  defaultBillingAddressId?: Types.ObjectId;

  @Prop({ type: Date, required: false })
  lastOrderAt?: Date;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

CustomerSchema.index({ lifecycleStage: 1, createdAt: -1 });

export type CustomerDocument = Customer & Document;
