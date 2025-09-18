import type { ProductPriceModel } from "./product-price.model";

export type ProductVariantModel = {
  id?: string;
  title: string;
  sku: string;
  barcode?: string;
  prices?: ProductPriceModel[];
  inventoryQuantity?: number;
  allowBackorder?: boolean;
};
