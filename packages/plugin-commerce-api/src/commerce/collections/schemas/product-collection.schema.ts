import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaDb, Types } from "mongoose";
import { COMMERCE_PLUGIN_NAMESPACE } from "../../../constants";
import { CollectionStatus } from "../models/collection-status.enum";
import {
  CollectionTranslation,
  CollectionTranslationSchema,
} from "./collection-translation.schema";

@Schema({
  collection: `${COMMERCE_PLUGIN_NAMESPACE}_collections`,
  timestamps: true,
  toJSON: { getters: true },
})
export class ProductCollection extends Document {
  @Prop({ type: String, default: "Collection" })
  type: string;

  @Prop({ type: SchemaDb.ObjectId, ref: "User", required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaDb.ObjectId, ref: "User", required: true })
  updatedBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: CollectionStatus,
    default: CollectionStatus.Draft,
  })
  status: CollectionStatus;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Date, default: null })
  publishAt?: Date;

  @Prop({ type: Date, default: null })
  expireAt?: Date;

  @Prop({ type: String, required: false })
  coverImage?: string;

  @Prop({ type: SchemaDb.ObjectId, ref: ProductCollection.name, default: null })
  parent?: Types.ObjectId;

  @Prop({
    type: Map,
    of: CollectionTranslationSchema,
    required: true,
    default: {},
  })
  translations: Map<string, CollectionTranslation>;
}

export const ProductCollectionSchema =
  SchemaFactory.createForClass(ProductCollection);

ProductCollectionSchema.index({ status: 1, sortOrder: 1 });
ProductCollectionSchema.index({ parent: 1, sortOrder: 1 });

export type ProductCollectionDocument = ProductCollection & Document;
