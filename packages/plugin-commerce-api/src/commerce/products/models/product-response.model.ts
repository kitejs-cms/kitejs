import type { ProductStatus } from "./product-status.enum";
import type { ProductSeoModel } from "./partials/product-seo.model";
import type { ProductVariantModel } from "./partials/product-variant.model";
import type { ProductOptionModel } from "./partials/product-option.model";

export type ProductResponseModel = {
  id: string;
  slug: string;
  language: string;
  status: ProductStatus;
  title: string;
  summary?: string;
  description?: string;
  seo?: ProductSeoModel;
  tags?: string[];
  publishAt?: string;
  expireAt?: string;
  thumbnail?: string;
  gallery?: string[];
  collections?: string[];
  options?: ProductOptionModel[];
  variants?: ProductVariantModel[];
  isDigital?: boolean;
};
