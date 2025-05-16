import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaDb, Types } from "mongoose";
import { PageStatus } from "../models/page-status.enum";
import { CORE_NAMESPACE } from "../../../constants";
import {
  PageTranslation,
  PageTranslationSchema,
} from "./page-translation.schema";

@Schema({
  collection: `${CORE_NAMESPACE}_pages`,
  timestamps: true,
  toJSON: { getters: true },
})
export class Page extends Document {
  @Prop({ type: String, default: "Page" })
  type: string;

  @Prop({
    type: String,
    required: false,
    default: null
  })
  image?: string;

  @Prop({ type: SchemaDb.ObjectId, ref: "User", required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaDb.ObjectId, ref: "User", required: true })
  updatedBy: Types.ObjectId;

  @Prop({ type: String, enum: PageStatus, default: PageStatus.Draft })
  status: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Date, default: null })
  publishAt?: Date;

  @Prop({ type: Date, default: null })
  expireAt?: Date;

  @Prop({ type: Map, of: PageTranslationSchema, required: true, default: {} })
  translations: Map<string, PageTranslation>;

  @Prop({
    type: [{ type: SchemaDb.ObjectId, ref: "Category" }],
    required: false,
    default: [],
  })
  categories?: Types.ObjectId[];
}

export const PageSchema = SchemaFactory.createForClass(Page);
