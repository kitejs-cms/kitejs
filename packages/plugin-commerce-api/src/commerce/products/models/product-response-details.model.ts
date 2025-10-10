import { ProductVariant } from "../schemas/product-variant.schema";
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
  variants: ProductVariant[];
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
