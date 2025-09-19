import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as SchemaDb, Types } from "mongoose";

@Schema({ _id: true, toJSON: { getters: true } })
export class OrderItem {
  id: string;

  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, required: false })
  variantTitle?: string;

  @Prop({ type: Number, required: true })
  quantity!: number;

  @Prop({ type: Number, required: true })
  unitPrice!: number;

  @Prop({ type: String, required: true })
  currencyCode!: string;

  @Prop({ type: SchemaDb.ObjectId, ref: "Product", required: false })
  productId?: Types.ObjectId;

  @Prop({ type: SchemaDb.ObjectId, required: false })
  variantId?: Types.ObjectId;

  @Prop({ type: String, required: false })
  sku?: string;

  @Prop({ type: Number, required: true })
  total!: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
