import type { StorageResponseDetailsModel } from "@kitejs-cms/core";
import type { ProductVariant } from "../schemas/product-variant.schema";
import type { ProductOptionModel } from "./partials/product-option.model";
import type { ProductTranslationModel } from "./partials/product-translation.model";
import type { ProductStatus } from "./product-status.enum";

export type ProductResponseDetailsModel = {
  id: string;
  status: ProductStatus;
  type: string;
  translations: Record<string, ProductTranslationModel>;
  isDigital: boolean;
  variants: ProductVariant[];
  collections: string[];
  options: ProductOptionModel[];
  gallery: StorageResponseDetailsModel[];
  tags: string[];
  publishAt?: string;
  expireAt?: string;
  thumbnail?: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};
