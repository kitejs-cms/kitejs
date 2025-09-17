import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { CollectionSeo } from "./collection-seo.schema";

@Schema({ _id: false })
export class CollectionTranslation {
  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, required: false })
  description?: string;

  @Prop({ type: CollectionSeo, required: false })
  seo?: CollectionSeo;
}

export const CollectionTranslationSchema =
  SchemaFactory.createForClass(CollectionTranslation);
