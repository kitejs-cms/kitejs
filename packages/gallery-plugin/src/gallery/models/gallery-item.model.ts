export interface GalleryItemModel {
  id: string;
  assetId: string;
  order?: number;
  caption?: string;
  altOverride?: string;
  linkUrl?: string;
  visibility?: "visible" | "hidden";
}

