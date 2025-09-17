import { ProductStatus } from "./product-status.enum";

export class ProductSeoModel {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
}

export class ProductPriceModel {
  currencyCode!: string;
  amount!: number;
  compareAtAmount?: number;
}

export class ProductVariantModel {
  id?: string;
  title!: string;
  sku!: string;
  barcode?: string;
  prices?: ProductPriceModel[];
  inventoryQuantity?: number;
  allowBackorder?: boolean;
}

export class ProductBaseModel {
  slug!: string;
  language!: string;
  status!: ProductStatus;
  title!: string;
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
}

export class ProductResponseModel {
  id!: string;
  slugs!: Record<string, string>;
  translations!: Record<string, Record<string, unknown>>;
  createdAt!: Date;
  updatedAt!: Date;
}
