import { Prop, Schema } from "@nestjs/mongoose";

@Schema({ _id: false })
export class GallerySeo {
  @Prop({ type: String, required: false })
  metaTitle: string;

  @Prop({ type: String, required: false })
  metaDescription: string;

  @Prop({ type: [String], default: [] })
  metaKeywords: string[];

  @Prop({ type: String, default: null })
  canonical?: string;
}
