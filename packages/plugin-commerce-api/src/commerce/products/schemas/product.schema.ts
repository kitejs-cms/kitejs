import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaDb, Types } from "mongoose";
import { ProductStatus } from "../models/product-status.enum";
import { COMMERCE_PLUGIN_NAMESPACE } from "../../../constants";
import { ProductVariant, ProductVariantSchema } from "./product-variant.schema";
import { ProductOptionSchema } from "./product-option.schema";
import { ProductOptionModel } from "../models/partials/product-option.model";
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

  @Prop({ type: SchemaDb.ObjectId, required: false, ref: "Storage" })
  thumbnail?: Types.ObjectId;

  @Prop({ type: [SchemaDb.ObjectId], default: [], ref: "Storage" })
  gallery: Types.ObjectId[];

  @Prop({
    type: [SchemaDb.ObjectId],
    ref: "ProductCollection",
    default: [],
  })
  collections: Types.ObjectId[];

  @Prop({ type: [ProductVariantSchema], default: [] })
  variants: ProductVariant[];

  @Prop({ type: [ProductOptionSchema], default: [] })
  options: ProductOptionModel[];

  @Prop({
    type: Map,
    of: ProductTranslationSchema,
    required: true,
    default: {},
  })
  translations: Record<string, ProductTranslation>;

  @Prop({ type: Boolean, default: false })
  isDigital: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ status: 1, updatedAt: -1 });
ProductSchema.index({ tags: 1 });
export type ProductDocument = Product & Document;
