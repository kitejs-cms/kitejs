import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaDb, Types } from "mongoose";
import { GalleryItem, GalleryItemSchema } from "./gallery-item.schema";
import { GalleryStatus } from "../models/gallery-status.enum";
import {
  GallerySettings,
  GallerySettingsSchema,
} from "./gallery-settings.schema";
import {
  GalleryTranslation,
  GalleryTranslationSchema,
} from "./gallery-translation.schema";
import { GALLERY_COLLECTION_NAME } from "../../constants";

/**
 * Documento principale della gallery
 * segue lo stile del tuo Page (type, createdBy/updatedBy, status, tags, publish/expire, translations Map)
 */
@Schema({
  collection: GALLERY_COLLECTION_NAME,
  timestamps: true,
  toJSON: { getters: true },
})
export class Gallery extends Document {
  @Prop({ type: String, default: "Gallery" })
  type: string;

  @Prop({ type: SchemaDb.ObjectId, ref: "User", required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaDb.ObjectId, ref: "User", required: true })
  updatedBy: Types.ObjectId;

  @Prop({ type: String, enum: GalleryStatus, default: GalleryStatus.Draft })
  status: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Date, default: null })
  publishAt?: Date;

  @Prop({ type: Date, default: null })
  expireAt?: Date;

  @Prop({
    type: Map,
    of: GalleryTranslationSchema,
    required: true,
    default: {},
  })
  translations: Map<string, GalleryTranslation>;

  @Prop({ type: [GalleryItemSchema], default: [] })
  items: GalleryItem[];

  // impostazioni di layout/rendering
  @Prop({ type: GallerySettingsSchema, default: {} })
  settings?: GallerySettings;
}

export const GallerySchema = SchemaFactory.createForClass(Gallery);

// Indici utili
GallerySchema.index({ status: 1, updatedAt: -1 });
GallerySchema.index({ slug: 1 }, { unique: true, sparse: true });
GallerySchema.index({ "items.assetId": 1 }); // per trovare dove è usato un Media
