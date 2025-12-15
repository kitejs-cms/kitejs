import type { ProductPriceModel } from "./product-price.model";

export type ProductVariantModel = {
  id?: string;
  title: string;
  sku: string;
  barcode?: string;
  prices?: ProductPriceModel[];
  inventoryQuantity?: number;
  allowBackorder?: boolean;
  gallery?: string[];
  optionName?: string;
  optionValue?: string;
  downloadUrl?: string;
};
