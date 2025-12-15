import type {
  ProductResponseDetailsModel,
  ProductTranslationModel,
} from "@kitejs-cms/plugin-commerce-api";
import type { MediaSource } from "./use-product-media";

export type ProductDetailsState = Omit<
  ProductResponseDetailsModel,
  "gallery" | "thumbnail"
> & {
  gallery: MediaSource[];
  thumbnail?: string | null;
};

export type ProductTranslationCandidate = {
  lang: string;
  translation: ProductTranslationModel;
};
