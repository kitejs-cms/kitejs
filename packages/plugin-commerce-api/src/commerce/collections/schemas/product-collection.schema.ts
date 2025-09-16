import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaDb, Types } from "mongoose";
import { COMMERCE_PLUGIN_NAMESPACE } from "../../../constants";

@Schema({ _id: false })
export class CollectionSeo {
  @Prop({ type: String })
  title?: string;

  @Prop({ type: String })
  description?: string;
}

export const CollectionSeoSchema = SchemaFactory.createForClass(CollectionSeo);

@Schema({
  collection: `${COMMERCE_PLUGIN_NAMESPACE}_collections`,
  timestamps: true,
  toJSON: { getters: true },
})
export class ProductCollection extends Document {
  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, required: true, unique: true, index: true })
  handle!: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Number, default: 0 })
  sortOrder!: number;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: String })
  coverImage?: string;

  @Prop({ type: SchemaDb.ObjectId, ref: "ProductCollection" })
  parent?: Types.ObjectId;

  @Prop({ type: CollectionSeoSchema })
  seo?: CollectionSeo;

  @Prop({
    type: SchemaDb.Types.Map,
    of: SchemaDb.Types.Mixed,
    default: {},
  })
  metadata?: Map<string, any>;
}

export const ProductCollectionSchema =
  SchemaFactory.createForClass(ProductCollection);

ProductCollectionSchema.index({ isActive: 1, sortOrder: 1 });

export type ProductCollectionDocument = ProductCollection & Document;
