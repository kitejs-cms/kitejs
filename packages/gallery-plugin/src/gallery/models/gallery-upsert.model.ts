import { GallerySeoModel } from "./gallery-seo.model";
import { GalleryStatus } from "./gallery-status.enum";
import { GalleryItemModel } from "./gallery-item.model";

export interface GalleryUpsertModel {
  id?: string;
  slug: string;
  language: string;
  status: GalleryStatus;
  tags?: string[];
  publishAt?: string;
  expireAt?: string;
  title: string;
  description?: string;
  items?: GalleryItemModel[];
  seo?: GallerySeoModel;
}

