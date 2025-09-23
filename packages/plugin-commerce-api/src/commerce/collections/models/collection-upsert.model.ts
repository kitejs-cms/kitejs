import { CollectionSeoModel } from "./collection-seo.model";
import { CollectionStatus } from "./collection-status.enum";

export type CollectionUpsertModel = {
  id?: string;
  slug: string;
  language: string;
  status: CollectionStatus;
  title: string;
  description?: string;
  seo: CollectionSeoModel;
  tags?: string[];
  publishAt?: string;
  expireAt?: string;
  coverImage?: string;
  parent?: string;
};
