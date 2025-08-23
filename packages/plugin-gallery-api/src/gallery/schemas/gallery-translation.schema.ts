import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { GallerySeo } from "./gallery-seo.schema";

@Schema({ _id: false })
export class GalleryTranslation {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: false })
  description?: string;

  @Prop({ type: GallerySeo, required: true })
  seo: GallerySeo;
}

export const GalleryTranslationSchema =
  SchemaFactory.createForClass(GalleryTranslation);
