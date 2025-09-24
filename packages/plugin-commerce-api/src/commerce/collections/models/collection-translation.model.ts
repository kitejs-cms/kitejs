import { CollectionSeoModel } from "./collection-seo.model";

export type CollectionTranslationModel = {
  title: string;
  description?: string;
  slug: string;
  seo?: CollectionSeoModel;
};
