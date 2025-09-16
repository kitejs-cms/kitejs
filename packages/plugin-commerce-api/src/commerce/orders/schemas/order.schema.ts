import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaDb, Types } from "mongoose";
import { OrderStatus } from "../models/order-status.enum";
import { PaymentStatus } from "../models/payment-status.enum";
import { FulfillmentStatus } from "../models/fulfillment-status.enum";
import { COMMERCE_PLUGIN_NAMESPACE } from "../../../constants";

@Schema({ _id: false })
export class OrderAddress {
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
}

export const OrderAddressSchema = SchemaFactory.createForClass(OrderAddress);

@Schema({ _id: true })
export class OrderItem {
  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String })
  variantTitle?: string;

  @Prop({ type: Number, required: true })
  quantity!: number;

  @Prop({ type: Number, required: true })
  unitPrice!: number;

  @Prop({ type: String, required: true })
  currencyCode!: string;

  @Prop({ type: SchemaDb.ObjectId, ref: "Product" })
  productId?: Types.ObjectId;

  @Prop({ type: SchemaDb.ObjectId })
  variantId?: Types.ObjectId;

  @Prop({ type: String })
  sku?: string;

  @Prop({
    type: SchemaDb.Types.Map,
    of: SchemaDb.Types.Mixed,
    default: {},
  })
  metadata?: Map<string, any>;

  @Prop({ type: Number, required: true })
  total!: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

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

  @Prop({ type: SchemaDb.ObjectId, ref: "Customer" })
  customer?: Types.ObjectId;

  @Prop({ type: String })
  email?: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: [OrderItemSchema], default: [] })
  items!: OrderItem[];

  @Prop({ type: Number, default: 0 })
  subtotal!: number;

  @Prop({ type: Number, default: 0 })
  shippingTotal!: number;

  @Prop({ type: Number, default: 0 })
  taxTotal!: number;

  @Prop({ type: Number, default: 0 })
  discountTotal!: number;

  @Prop({ type: Number, default: 0 })
  total!: number;

  @Prop({ type: OrderAddressSchema })
  billingAddress?: OrderAddress;

  @Prop({ type: OrderAddressSchema })
  shippingAddress?: OrderAddress;

  @Prop({ type: Date })
  paidAt?: Date;

  @Prop({ type: Date })
  fulfilledAt?: Date;

  @Prop({ type: Date })
  cancelledAt?: Date;

  @Prop({
    type: SchemaDb.Types.Map,
    of: SchemaDb.Types.Mixed,
    default: {},
  })
  metadata?: Map<string, any>;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ customer: 1, createdAt: -1 });

export type OrderDocument = Order & Document;
