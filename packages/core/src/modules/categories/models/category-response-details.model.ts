import { CategoryTranslationModel } from "./category-translation.model";

export type CategoryResponseDetailsModel = {
  id: string;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
  tags: string[];
  parent?: string | null;
  translations: Record<string, CategoryTranslationModel>;
  createdAt: string;
  updatedAt: string;
};
