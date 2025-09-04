import type {
  GalleryStatus,
  GallerySettingsModel,
} from "../../../plugin-gallery-api/dist";

export const BREAKPOINTS = ["desktop", "tablet", "mobile"] as const;

export const GALLERY_LAYOUTS = ["grid", "masonry", "slider"] as const;

export const GALLERY_MODES = ["responsive", "manual"] as const;

export const DEFAULT_RESPONSIVE_RULES = {
  desktop: { columns: 3, gap: 12 },
  tablet: { columns: 2, gap: 10 },
  mobile: { columns: 1, gap: 8 },
};

export const DEFAULT_MANUAL_RULES = { columns: 3, gap: 12 };

export const DEFAULT_SETTINGS: GallerySettingsModel = {
  responsive: DEFAULT_RESPONSIVE_RULES,
  manual: DEFAULT_MANUAL_RULES,
  layout: "grid",
  mode: "responsive",
  ratio: "auto",
};

export const EMPTY_GALLERY = (defaultLang: string) => ({
  id: "",
  status: "Draft" as GalleryStatus,
  tags: [],
  publishAt: new Date(),
  expireAt: null,
  items: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: "",
  updatedBy: "",
  settings: DEFAULT_SETTINGS,
  translations: {
    [defaultLang]: {
      title: "",
      description: "",
      slug: "",
      seo: {
        metaTitle: "",
        metaDescription: "",
        metaKeywords: [],
        canonical: "",
      },
    },
  },
});
