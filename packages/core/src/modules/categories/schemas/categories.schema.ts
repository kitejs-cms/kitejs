import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaDb, Types } from "mongoose";
import { CORE_NAMESPACE } from "../../../constants";
import {
  CategoryTranslation,
  CategoryTranslationSchema,
} from "./category-translation.schema";

@Schema({
  collection: `${CORE_NAMESPACE}_categories`,
  timestamps: true,
  toJSON: { getters: true },
})
export class Category extends Document {
  @Prop({ type: SchemaDb.ObjectId, ref: "User", required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaDb.ObjectId, ref: "User", required: true })
  updatedBy: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Types.ObjectId, ref: "Category", default: null })
  parent?: Types.ObjectId;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: String, default: null })
  description?: string;

  @Prop({
    type: Map,
    of: CategoryTranslationSchema,
    required: true,
    default: {},
  })
  translations: Map<string, CategoryTranslation>;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
