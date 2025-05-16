import { PageStatus } from "./page-status.enum";
import { PageTranslationModel } from "./page-translation.model";

export type PageResponseDetailsModel = {
  id: string;
  image?: string
  createdBy: string;
  updatedBy: string;
  status: PageStatus;
  tags?: string[];
  publishAt?: string | null;
  expireAt?: string | null;
  translations: Record<string, PageTranslationModel>;
  createdAt: string;
  updatedAt: string;
  categories: string[]
};
