import { Prop, SchemaFactory, Schema } from "@nestjs/mongoose";

@Schema({ _id: false })
class ProductOption {
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: [String], default: [] })
  values!: string[];

  @Prop({ type: Number, default: 0 })
  position!: number;
}

export const ProductOptionSchema = SchemaFactory.createForClass(ProductOption);
