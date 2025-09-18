import type { CollectionStatus } from "./collection-status.enum";
import type { CollectionSeoModel } from "./collection-seo.model";

export type CollectionBaseModel = {
  slug: string;
  language: string;
  status: CollectionStatus;
  title: string;
  description?: string;
  seo?: CollectionSeoModel;
  tags?: string[];
  publishAt?: string;
  expireAt?: string;
  coverImage?: string;
  parentId?: string;
  sortOrder?: number;
};
