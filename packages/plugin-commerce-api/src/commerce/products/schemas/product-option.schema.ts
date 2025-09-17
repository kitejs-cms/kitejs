import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ _id: false })
export class ProductOption {
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: [String], default: [] })
  values: string[];
}

export const ProductOptionSchema = SchemaFactory.createForClass(ProductOption);
