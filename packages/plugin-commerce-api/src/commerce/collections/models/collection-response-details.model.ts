import { CollectionTranslationModel } from "./collection-translation.model";

export type CollectionResponseDetailslModel = {
  id: string;
  slugs: Record<string, string>;
  translations: Record<string, CollectionTranslationModel>;
  createdAt: Date;
  updatedAt: Date;
};
