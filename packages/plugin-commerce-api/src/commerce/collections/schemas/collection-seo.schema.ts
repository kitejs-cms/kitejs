import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ _id: false })
export class CollectionSeo {
  @Prop({ type: String, required: false })
  metaTitle?: string;

  @Prop({ type: String, required: false })
  metaDescription?: string;

  @Prop({ type: [String], default: [] })
  metaKeywords: string[];

  @Prop({ type: String, required: false })
  canonicalUrl?: string;
}

export const CollectionSeoSchema = SchemaFactory.createForClass(CollectionSeo);
