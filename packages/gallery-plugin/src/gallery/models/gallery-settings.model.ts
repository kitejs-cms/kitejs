export interface GallerySettingsModel {
  layout?: 'grid' | 'masonry' | 'slider';
  columns?: number | null;
  gap?: number | null;
  ratio?: string | null;
  autoplay?: boolean | null;
  loop?: boolean | null;
  lightbox?: boolean | null;
}
