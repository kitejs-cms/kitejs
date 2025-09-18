import { ProductStatus } from "./product-status.enum";

export type ProductSeoModel = {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
};

export type ProductPriceModel = {
  currencyCode: string;
  amount: number;
  compareAtAmount?: number;
};

export type ProductVariantModel = {
  id?: string;
  title: string;
  sku: string;
  barcode?: string;
  prices?: ProductPriceModel[];
  inventoryQuantity?: number;
  allowBackorder?: boolean;
};

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

export type ProductResponseModel = {
  id: string;
  slugs: Record<string, string>;
  translations: Record<string, Record<string, unknown>>;
  createdAt: Date;
  updatedAt: Date;
};
