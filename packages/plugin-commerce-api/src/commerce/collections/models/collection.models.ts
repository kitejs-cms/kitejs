import { CollectionStatus } from "./collection-status.enum";

export type CollectionSeoModel = {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
};

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

export type CollectionResponseModel = {
  id: string;
  slugs: Record<string, string>;
  translations: Record<string, Record<string, unknown>>;
  createdAt: Date;
  updatedAt: Date;
};
