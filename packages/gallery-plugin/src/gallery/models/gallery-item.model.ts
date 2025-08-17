export interface GalleryItemModel {
  assetId: string;
  order?: number;
  caption?: string;
  altOverride?: string;
  linkUrl?: string;
  visibility?: "visible" | "hidden";
}

