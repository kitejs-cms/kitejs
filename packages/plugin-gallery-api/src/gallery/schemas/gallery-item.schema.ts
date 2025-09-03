import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as SchemaDb, Types } from "mongoose";

@Schema({
  timestamps: true,
  toJSON: { getters: true },
})
export class GalleryItem {
  @Prop({ type: SchemaDb.ObjectId, ref: "Media", required: true })
  assetId: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  order: number;

  @Prop({ type: String, default: null })
  caption?: string;

  @Prop({ type: String, default: null })
  altOverride?: string;

  @Prop({ type: String, default: null })
  linkUrl?: string;

  @Prop({ type: String, enum: ["visible", "hidden"], default: "visible" })
  visibility?: "visible" | "hidden";
}

export const GalleryItemSchema = SchemaFactory.createForClass(GalleryItem);
