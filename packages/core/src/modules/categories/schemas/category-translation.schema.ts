import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ _id: false })
export class CategoryTranslation {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: false })
  description: string;
}

export const CategoryTranslationSchema =
  SchemaFactory.createForClass(CategoryTranslation);
