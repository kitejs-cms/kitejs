import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaDb, Types } from "mongoose";
import { OrderStatus } from "../models/order-status.enum";
import { PaymentStatus } from "../models/payment-status.enum";
import { FulfillmentStatus } from "../models/fulfillment-status.enum";
import { COMMERCE_PLUGIN_NAMESPACE } from "../../../constants";
import { OrderAddress, OrderAddressSchema } from "./order-address.schema";
import { OrderItem, OrderItemSchema } from "./order-item.schema";

@Schema({
  collection: `${COMMERCE_PLUGIN_NAMESPACE}_orders`,
  timestamps: true,
  toJSON: { getters: true },
})
export class Order extends Document {
  @Prop({ type: String, required: true, unique: true, index: true })
  orderNumber!: string;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.Pending })
  status!: OrderStatus;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.Awaiting })
  paymentStatus!: PaymentStatus;

  @Prop({
    type: String,
    enum: FulfillmentStatus,
    default: FulfillmentStatus.Unfulfilled,
  })
  fulfillmentStatus!: FulfillmentStatus;

  @Prop({ type: String, required: true })
  currencyCode!: string;

  @Prop({ type: SchemaDb.ObjectId, ref: "Customer", required: false })
  customer?: Types.ObjectId;

  @Prop({ type: String, required: false })
  email?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: String, required: false })
  notes?: string;

  @Prop({ type: [OrderItemSchema], default: [] })
  items: OrderItem[];

  @Prop({ type: Number, default: 0 })
  subtotal: number;

  @Prop({ type: Number, default: 0 })
  shippingTotal: number;

  @Prop({ type: Number, default: 0 })
  taxTotal: number;

  @Prop({ type: Number, default: 0 })
  discountTotal: number;

  @Prop({ type: Number, default: 0 })
  total: number;

  @Prop({ type: OrderAddressSchema, required: false })
  billingAddress?: OrderAddress;

  @Prop({ type: OrderAddressSchema, required: false })
  shippingAddress?: OrderAddress;

  @Prop({ type: Date, required: false })
  paidAt?: Date;

  @Prop({ type: Date, required: false })
  fulfilledAt?: Date;

  @Prop({ type: Date, required: false })
  cancelledAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ customer: 1, createdAt: -1 });

export type OrderDocument = Order & Document;
