import type { ProductVariantModel } from "./partials/product-variant.model";
import { ProductOptionModel } from "./partials/product-option.model";
import { ProductTranslationModel } from "./partials/product-translation.model";
import { ProductStatus } from "./product-status.enum";

export type ProductResponseDetailsModel = {
  id: string;
  status: ProductStatus;
  type: string;
  translations: Record<string, ProductTranslationModel>;
  isDigital: boolean;
  defaultCurrency: string;
  variants: ProductVariantModel[];
  collections: string[];
  options: ProductOptionModel[];
  gallery: string[];
  tags: string[];
  publishAt?: Date;
  expireAt?: Date;
  thumbnail?: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};
