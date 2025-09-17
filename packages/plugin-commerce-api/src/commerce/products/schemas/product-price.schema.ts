import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ _id: false })
export class ProductPrice {
  @Prop({ type: String, required: true })
  currencyCode!: string;

  @Prop({ type: Number, required: true })
  amount!: number;

  @Prop({ type: Number, required: false })
  compareAtAmount?: number;
}

export const ProductPriceSchema = SchemaFactory.createForClass(ProductPrice);
