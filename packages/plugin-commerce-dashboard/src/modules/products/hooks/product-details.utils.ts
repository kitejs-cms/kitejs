import type { ProductTranslationModel } from "@kitejs-cms/plugin-commerce-api";
import type { VariantGalleryOption } from "../components/variants-section";
import { type ProductDetailsState } from "./product-details.types";
import type { MediaSource } from "./use-product-media";

export const arraysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

export const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-");

export const slugifyOptionHandle = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const formatOptionDisplayName = (value: string) =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");

export const extractAssetId = (
  source: MediaSource | undefined | null
): string | null => {
  if (!source) return null;
  if (typeof source === "string") return source;
  return (
    source.assetId ??
    source.id ??
    source._id ??
    source.path ??
    null
  );
};

export const mapAssetIdsToSources = (
  assetIds: string[],
  previous: MediaSource[]
): MediaSource[] => {
  if (!assetIds.length) return [];

  const lookup = new Map<string, MediaSource>();
  previous.forEach((entry) => {
    const key = extractAssetId(entry);
    if (key) {
      lookup.set(key, entry);
    }
  });

  return assetIds.map((id) => lookup.get(id) ?? id);
};

export const isLikelyExternalUrl = (value: string) => /^https?:\/\//i.test(value);

const getUrlPath = (value: string): string | null => {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.pathname;
  } catch (error) {
    const normalized = value.split("?")[0];
    return normalized.startsWith("/") ? normalized : null;
  }
};

const findGalleryAssetIdByUrl = (
  gallery: MediaSource[],
  url: string
): string | null => {
  const targetPath = getUrlPath(url);
  if (!targetPath) return null;

  for (const entry of gallery) {
    if (!entry) continue;

    if (typeof entry === "string") {
      if (!isLikelyExternalUrl(entry)) continue;
      const entryPath = getUrlPath(entry);
      if (entryPath && entryPath === targetPath) {
        // String entries don't provide a stable asset identifier, so skip.
        continue;
      }
      continue;
    }

    const urlsToCompare: string[] = [];
    if (typeof entry.url === "string") {
      urlsToCompare.push(entry.url);
    }
    const previewUrl = (entry as { previewUrl?: string | null }).previewUrl;
    if (typeof previewUrl === "string") {
      urlsToCompare.push(previewUrl);
    }

    for (const candidate of urlsToCompare) {
      const candidatePath = getUrlPath(candidate);
      if (candidatePath && candidatePath === targetPath) {
        const assetId = extractAssetId(entry);
        if (assetId) return assetId;
      }
    }

    const entryPath = (entry as { path?: string | null }).path;
    if (typeof entryPath === "string" && targetPath.endsWith(entryPath)) {
      const assetId = extractAssetId(entry);
      if (assetId) return assetId;
    }
  }

  return null;
};

export const normalizeThumbnailIdentifier = (
  thumbnail: string | null | undefined,
  gallery: MediaSource[]
): string | null => {
  if (!thumbnail) return null;
  if (!isLikelyExternalUrl(thumbnail)) return thumbnail;

  return findGalleryAssetIdByUrl(gallery, thumbnail);
};

export const hydrateProductDetails = (
  product: ProductDetailsState
): ProductDetailsState => {
  const gallery = (product.gallery ?? []) as MediaSource[];
  const normalizedThumbnail = normalizeThumbnailIdentifier(
    product.thumbnail ?? null,
    gallery
  );

  const normalizedOptions = (product.options ?? [])
    .map((option, index) => {
      const trimmedName = option?.name?.trim() ?? "";
      const slug = trimmedName
        ? slugifyOptionHandle(trimmedName)
        : slugifyOptionHandle(option?.displayName ?? "");

      const displayName = option?.displayName?.trim();

      const values = Array.isArray(option?.values)
        ? option.values
            .map((value) => value?.trim())
            .filter((value): value is string => Boolean(value))
        : [];

      return {
        name: slug || `option-${index + 1}`,
        displayName:
          displayName && displayName.length > 0
            ? displayName
            : trimmedName
              ? formatOptionDisplayName(trimmedName)
              : `Option ${index + 1}`,
        values,
        position:
          typeof option?.position === "number" ? option.position : index,
      } satisfies ProductDetailsState["options"][number];
    })
    .sort((a, b) => a.position - b.position);

  const normalizedVariants = (product.variants ?? []).map((variant) => ({
    ...variant,
    optionName: variant.optionName?.trim() ?? undefined,
    optionValue: variant.optionValue?.trim() ?? undefined,
    gallery: Array.isArray(variant.gallery)
      ? variant.gallery.filter(
          (id): id is string => typeof id === "string" && Boolean(id)
        )
      : [],
  }));

  return {
    ...product,
    gallery,
    thumbnail: normalizedThumbnail ?? product.thumbnail ?? null,
    options: normalizedOptions,
    variants: normalizedVariants,
  };
};

export const buildVariantGalleryOptions = (
  localData: ProductDetailsState | null,
  languages: string[],
  productGallery: MediaSource[]
): VariantGalleryOption[] => {
  if (!localData) return [];

  return (productGallery ?? [])
    .map((entry) => {
      const assetId = extractAssetId(entry);
      if (!assetId) return null;

      if (typeof entry === "string") {
        return {
          id: assetId,
          label: assetId,
          url: isLikelyExternalUrl(entry) ? entry : null,
        } satisfies VariantGalleryOption;
      }

      const localizedLabel = languages.reduce<string | undefined>((acc, lang) => {
        if (acc) return acc;
        const title = entry.title?.[lang]?.trim();
        if (title) return title;
        const alt = entry.alt?.[lang]?.trim();
        if (alt) return alt;
        return acc;
      }, undefined);

      return {
        id: assetId,
        label: localizedLabel ?? entry.name ?? entry.path ?? assetId ?? "",
        url: entry.url ?? null,
      } satisfies VariantGalleryOption;
    })
    .filter((option): option is VariantGalleryOption => option !== null);
};

export const getTranslationCandidate = (
  translations: Record<string, ProductTranslationModel>,
  lang?: string
) => {
  if (!lang) return null;
  const translation = translations[lang];
  if (translation?.title?.trim() && translation?.slug?.trim()) {
    return { lang, translation } as const;
  }
  return null;
};
