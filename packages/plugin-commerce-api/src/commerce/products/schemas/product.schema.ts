import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaDb, Types } from "mongoose";
import { ProductStatus } from "../models/product-status.enum";
import { COMMERCE_PLUGIN_NAMESPACE } from "../../../constants";
import { ProductVariant, ProductVariantSchema } from "./product-variant.schema";
import {
  ProductTranslation,
  ProductTranslationSchema,
} from "./product-translation.schema";

@Schema({
  collection: `${COMMERCE_PLUGIN_NAMESPACE}_products`,
  timestamps: true,
  toJSON: { getters: true },
})
export class Product extends Document {
  @Prop({ type: String, default: "Product" })
  type: string;

  @Prop({ type: SchemaDb.ObjectId, ref: "User", required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaDb.ObjectId, ref: "User", required: true })
  updatedBy: Types.ObjectId;

  @Prop({ type: String, enum: ProductStatus, default: ProductStatus.Draft })
  status: ProductStatus;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Date, default: null })
  publishAt?: Date;

  @Prop({ type: Date, default: null })
  expireAt?: Date;

  @Prop({ type: String, required: false })
  thumbnail?: string;

  @Prop({ type: [String], default: [] })
  gallery: string[];

  @Prop({
    type: [SchemaDb.ObjectId],
    ref: "ProductCollection",
    default: [],
  })
  collections: Types.ObjectId[];

  @Prop({ type: [ProductVariantSchema], default: [] })
  variants: ProductVariant[];

  @Prop({ type: String, default: "EUR" })
  defaultCurrency: string;

  @Prop({
    type: Map,
    of: ProductTranslationSchema,
    required: true,
    default: {},
  })
  translations: Map<string, ProductTranslation>;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ status: 1, updatedAt: -1 });
ProductSchema.index({ tags: 1 });
export type ProductDocument = Product & Document;
