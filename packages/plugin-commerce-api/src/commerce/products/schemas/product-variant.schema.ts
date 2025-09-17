import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import {
  ProductVariantOption,
  ProductVariantOptionSchema,
} from "./product-variant-option.schema";
import { ProductPrice, ProductPriceSchema } from "./product-price.schema";

@Schema({ _id: true })
export class ProductVariant {
  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, required: true })
  sku!: string;

  @Prop({ type: String, required: false })
  barcode?: string;

  @Prop({ type: [ProductPriceSchema], default: [] })
  prices: ProductPrice[];

  @Prop({ type: Number, default: 0 })
  inventoryQuantity: number;

  @Prop({ type: Boolean, default: false })
  allowBackorder: boolean;

  @Prop({ type: [ProductVariantOptionSchema], default: [] })
  options: ProductVariantOption[];
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);
