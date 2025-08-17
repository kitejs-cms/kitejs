import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ _id: false })
export class GallerySettings {
  @Prop({ type: String, enum: ["grid", "masonry", "slider"], default: "grid" })
  layout: "grid" | "masonry" | "slider";

  @Prop({ type: Number, default: null })
  columns?: number;

  @Prop({ type: Number, default: null })
  gap?: number;

  @Prop({ type: String, default: null })
  ratio?: string; // es. "16:9", "1:1"

  @Prop({ type: Boolean, default: false })
  autoplay?: boolean;

  @Prop({ type: Boolean, default: false })
  loop?: boolean;

  @Prop({ type: Boolean, default: true })
  lightbox?: boolean;
}

export const GallerySettingsSchema =
  SchemaFactory.createForClass(GallerySettings);
