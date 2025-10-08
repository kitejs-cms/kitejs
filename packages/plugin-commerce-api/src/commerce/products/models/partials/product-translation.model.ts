import { ProductSeo } from "../../schemas/product-seo.schema";

export type ProductTranslationModel = {
  title: string;
  subtitle?: string;
  summary?: string;
  description?: string;
  seo?: ProductSeo;
  slug: string;
};
