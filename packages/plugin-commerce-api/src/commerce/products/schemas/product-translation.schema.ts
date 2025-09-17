import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ProductSeo } from "./product-seo.schema";

@Schema({ _id: false })
export class ProductTranslation {
  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, required: false })
  subtitle?: string;

  @Prop({ type: String, required: false })
  summary?: string;

  @Prop({ type: String, required: false })
  description?: string;

  @Prop({ type: ProductSeo, required: false })
  seo?: ProductSeo;
}

export const ProductTranslationSchema =
  SchemaFactory.createForClass(ProductTranslation);
