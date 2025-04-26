import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaDb, Types } from "mongoose";
import { PageStatus } from "../models/page-status.enum";
import {
  PageTranslation,
  PageTranslationSchema,
} from "./page-translation.schema";

@Schema({ timestamps: true, toJSON: { getters: true } })
export class Page extends Document {
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
}

export const PageSchema = SchemaFactory.createForClass(Page);
