import type { ProductStatus } from "./product-status.enum";
import type { ProductSeoModel } from "./product-seo.model";
import type { ProductVariantModel } from "./product-variant.model";

export type ProductBaseModel = {
  slug: string;
  language: string;
  status: ProductStatus;
  title: string;
  subtitle?: string;
  summary?: string;
  description?: string;
  seo?: ProductSeoModel;
  tags?: string[];
  publishAt?: string;
  expireAt?: string;
  thumbnail?: string;
  gallery?: string[];
  collectionIds?: string[];
  variants?: ProductVariantModel[];
  defaultCurrency?: string;
};
