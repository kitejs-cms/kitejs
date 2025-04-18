import { PageTranslationModel } from "./page-translation.model";

export enum PageStatus {
  "Draft" = "draft",
  "Published" = "published",
  "Archived" = "archived",
}

export type PageDetailModel = {
  id: string;
  slug: string;
  createdBy: string;
  updatedBy: string;
  status: PageStatus;
  tags?: string[];
  publishAt?: string;
  expireAt?: string;
  translations: Record<string, PageTranslationModel>;
  createdAt: string;
  updatedAt: string;
};
