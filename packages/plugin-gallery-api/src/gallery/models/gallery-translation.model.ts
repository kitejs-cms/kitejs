import { GallerySeoModel } from "./gallery-seo.model";

export interface GalleryTranslationModel {
  title: string;
  description?: string;
  slug: string;
  seo: GallerySeoModel;
}

