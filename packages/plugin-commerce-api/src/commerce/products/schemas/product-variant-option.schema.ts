import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ _id: false })
export class ProductVariantOption {
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, required: true })
  value!: string;
}

export const ProductVariantOptionSchema =
  SchemaFactory.createForClass(ProductVariantOption);
