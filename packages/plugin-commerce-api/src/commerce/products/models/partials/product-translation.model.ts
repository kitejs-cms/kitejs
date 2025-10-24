import { ProductSeo } from "../../schemas/product-seo.schema";

export type ProductTranslationModel = {
  title: string;
  summary?: string;
  description?: string;
  seo?: ProductSeo;
  slug: string;
};
