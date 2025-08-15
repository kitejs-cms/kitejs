import { GalleryStatus } from "./gallery-status.enum";
import { GalleryTranslationModel } from "./gallery-translation.model";
import { GalleryItemModel } from "./gallery-item.model";

export interface GalleryResponseModel {
  id: string;
  status: GalleryStatus;
  tags: string[];
  publishAt?: Date;
  expireAt?: Date;
  translations: Record<string, GalleryTranslationModel>;
  items: GalleryItemModel[];
  categories?: string[];
  createdAt: Date;
  updatedAt: Date;
}

