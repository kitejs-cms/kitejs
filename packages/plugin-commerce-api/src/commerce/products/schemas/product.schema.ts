import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaDb, Types } from "mongoose";
import { InventoryPolicy } from "../models/inventory-policy.enum";
import { ProductStatus } from "../models/product-status.enum";
import { COMMERCE_PLUGIN_NAMESPACE } from "../../../constants";

@Schema({ _id: false })
export class MoneyAmount {
  @Prop({ type: String, required: true })
  currencyCode!: string;

  @Prop({ type: Number, required: true })
  amount!: number;

  @Prop({ type: Number })
  compareAtAmount?: number;
}

export const MoneyAmountSchema = SchemaFactory.createForClass(MoneyAmount);

@Schema({ _id: false })
export class ProductVariantOption {
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, required: true })
  value!: string;
}

export const ProductVariantOptionSchema =
  SchemaFactory.createForClass(ProductVariantOption);

@Schema({ _id: false })
export class Dimensions {
  @Prop({ type: Number })
  length?: number;

  @Prop({ type: Number })
  width?: number;

  @Prop({ type: Number })
  height?: number;
}

export const DimensionsSchema = SchemaFactory.createForClass(Dimensions);

@Schema({ _id: false })
export class ProductOption {
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: [String], default: [] })
  values!: string[];
}

export const ProductOptionSchema = SchemaFactory.createForClass(ProductOption);

@Schema({ _id: true, timestamps: false })
export class ProductVariant {
  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, required: true })
  sku!: string;

  @Prop({ type: String })
  barcode?: string;

  @Prop({ type: [MoneyAmountSchema], default: [] })
  prices!: MoneyAmount[];

  @Prop({ type: Number, default: 0 })
  inventoryQuantity!: number;

  @Prop({
    type: String,
    enum: InventoryPolicy,
    default: InventoryPolicy.Deny,
  })
  inventoryPolicy!: InventoryPolicy;

  @Prop({ type: Boolean, default: true })
  manageInventory!: boolean;

  @Prop({ type: Boolean, default: false })
  allowBackorder!: boolean;

  @Prop({ type: [ProductVariantOptionSchema], default: [] })
  options!: ProductVariantOption[];

  @Prop({ type: Number })
  weight?: number;

  @Prop({ type: DimensionsSchema })
  dimensions?: Dimensions;

  @Prop({
    type: SchemaDb.Types.Map,
    of: SchemaDb.Types.Mixed,
    default: {},
  })
  metadata?: Map<string, any>;
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);

@Schema({
  collection: `${COMMERCE_PLUGIN_NAMESPACE}_products`,
  timestamps: true,
  toJSON: { getters: true },
})
export class Product extends Document {
  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, required: true, unique: true, index: true })
  handle!: string;

  @Prop({ type: String })
  subtitle?: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: String, enum: ProductStatus, default: ProductStatus.Draft })
  status!: ProductStatus;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: String })
  thumbnail?: string;

  @Prop({
    type: [SchemaDb.ObjectId],
    ref: "ProductCollection",
    default: [],
  })
  collections!: Types.ObjectId[];

  @Prop({ type: [ProductOptionSchema], default: [] })
  options!: ProductOption[];

  @Prop({ type: [ProductVariantSchema], default: [] })
  variants!: ProductVariant[];

  @Prop({ type: [MoneyAmountSchema], default: [] })
  pricing!: MoneyAmount[];

  @Prop({ type: Boolean, default: false })
  isGiftCard!: boolean;

  @Prop({ type: Number })
  weight?: number;

  @Prop({ type: Date })
  publishedAt?: Date;

  @Prop({
    type: SchemaDb.Types.Map,
    of: SchemaDb.Types.Mixed,
    default: {},
  })
  metadata?: Map<string, any>;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ status: 1, updatedAt: -1 });
ProductSchema.index({ tags: 1 });

export type ProductDocument = Product & Document;
