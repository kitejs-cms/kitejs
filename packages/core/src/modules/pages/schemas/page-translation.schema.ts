import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { PageSeo } from "./page-seo.schema";
import { PageBlock } from "./page-block.schema";

@Schema({ _id: false })
export class PageTranslation {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: false })
  description: string;

  @Prop({ type: [PageBlock], default: [] })
  blocks: PageBlock[];

  @Prop({ type: PageSeo, required: true })
  seo: PageSeo;
}

export const PageTranslationSchema =
  SchemaFactory.createForClass(PageTranslation);
