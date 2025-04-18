import { Prop, Schema } from "@nestjs/mongoose";

@Schema({ _id: false })
export class PageSeo {
  @Prop({ type: String, required: true })
  metaTitle: string;

  @Prop({ type: String, required: true })
  metaDescription: string;

  @Prop({ type: [String], default: [] })
  metaKeywords: string[];

  @Prop({ type: String, default: null })
  canonical?: string;
}
