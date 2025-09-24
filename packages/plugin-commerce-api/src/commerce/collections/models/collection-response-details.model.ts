import { CollectionStatus } from "./collection-status.enum";
import { CollectionTranslationModel } from "./collection-translation.model";

export type CollectionResponseDetailslModel = {
  id: string;
  translations: Record<string, CollectionTranslationModel>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  publishAt?: string;
  expireAt?: string;
  tags: string[];
  status: CollectionStatus;
  parent?: string;
};
