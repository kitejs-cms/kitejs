export type GalleryLayout = "grid" | "masonry" | "slider";
export type Breakpoint = "desktop" | "tablet" | "mobile";
export type GalleryMode = "responsive" | "manual";

export type BreakpointSettingsModel = {
  columns: number;
  gap: number;
};

export interface CommonGallerySettings {
  layout: GalleryLayout;
  ratio?: string | null;
}

export type ResponsiveGallerySettingsModel = {
  desktop: BreakpointSettingsModel;
  tablet: BreakpointSettingsModel;
  mobile: BreakpointSettingsModel;
};

export type GallerySettingsModel = {
  layout: GalleryLayout;
  mode: GalleryMode;
  responsive?: ResponsiveGallerySettingsModel;
  manual?: BreakpointSettingsModel;
  ratio: string;
};
