import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  useApi,
  useBreadcrumb,
  useSettingsContext,
} from "@kitejs-cms/dashboard-core";
import type {
  ProductResponseDetailsModel,
  ProductTranslationModel,
  ProductUpsertModel,
  ProductSeoModel,
  ProductPriceModel,
  ProductVariantModel,
} from "@kitejs-cms/plugin-commerce-api";
import type { MediaSource } from "./use-product-media";
import type {
  VariantFieldErrors,
  VariantGalleryOption,
} from "../components/variants-section";

const arraysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-");

const getTranslationCandidate = (
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

type ProductDetailsState = Omit<
  ProductResponseDetailsModel,
  "gallery" | "thumbnail"
> & {
  gallery: MediaSource[];
  thumbnail?: string | null;
};

const extractAssetId = (source: MediaSource | undefined | null): string | null => {
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

const mapAssetIdsToSources = (
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

const isLikelyExternalUrl = (value: string) => /^https?:\/\//i.test(value);

const hydrateProductDetails = (
  product: ProductResponseDetailsModel
): ProductDetailsState => ({
  ...product,
  gallery: product.gallery ?? [],
  thumbnail: product.thumbnail ?? null,
});

const findTranslationForUpsert = (
  product: ProductDetailsState,
  preferredLang?: string,
  fallbackLang?: string
) => {
  const translations = product.translations ?? {};

  const preferred = getTranslationCandidate(translations, preferredLang);
  if (preferred) return preferred;

  const fallback = getTranslationCandidate(translations, fallbackLang);
  if (fallback) return fallback;

  const entry = Object.entries(translations).find(([, translation]) =>
    Boolean(translation?.title?.trim() && translation?.slug?.trim())
  );

  return entry ? { lang: entry[0], translation: entry[1] } : null;
};

export interface FormErrors {
  title?: string;
  slug?: string;
  thumbnail?: string;
  apiError?: string;
  [key: string]: string | undefined;
}

export function useProductDetails() {
  const navigate = useNavigate();
  const { t } = useTranslation("commerce");
  const { setBreadcrumb } = useBreadcrumb();
  const { cmsSettings } = useSettingsContext();

  const defaultLang = useMemo(
    () => cmsSettings?.defaultLanguage,
    [cmsSettings]
  );

  const defaultCurrency = useMemo(() => {
    if (!cmsSettings) return "EUR";
    const commerceSettings = (cmsSettings as unknown as {
      commerce?: { defaultCurrency?: string };
    })?.commerce;

    const code = commerceSettings?.defaultCurrency;
    if (typeof code === "string" && code.trim()) {
      return code.trim().toUpperCase();
    }

    return "EUR";
  }, [cmsSettings]);

  const { loading, fetchData } = useApi<ProductResponseDetailsModel>();
  const { id } = useParams<{ id: string }>();

  const [activeLang, setActiveLang] = useState(defaultLang);
  const [hasChanges, setHasChanges] = useState(false);
  const [navigateTo, setNavigateTo] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);

  const [localData, setLocalData] = useState<ProductDetailsState | null>(null);
  const [variantErrors, setVariantErrors] = useState<VariantFieldErrors[]>([]);

  useEffect(() => {
    const items = [
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.products"), path: "/commerce/products" },
    ];

    if (id && localData && localData?.translations[activeLang]?.slug)
      items.push({
        label: localData.translations[activeLang].slug,
        path: `/commerce/products/${localData.id}`,
      });

    setBreadcrumb(items);
  }, [activeLang, id, localData, setBreadcrumb, t]);

  useEffect(() => {
    if (!defaultLang) return;

    if (id === "create") {
      const newProduct: ProductDetailsState = {
        id: "",
        status: "Draft" as never,
        type: "",
        isDigital: false,
        variants: [],
        options: [],
        gallery: [],
        tags: [],
        createdBy: "",
        collections: [],
        updatedBy: "",
        createdAt: undefined,
        updatedAt: undefined,
        publishAt: undefined,
        expireAt: undefined,
        thumbnail: null,
        translations: {
          [defaultLang]: {
            title: "",
            slug: "",
            description: "",
            summary: "",
          },
        },
      };

      setLocalData(newProduct);
      setActiveLang(defaultLang);
      setVariantErrors([]);
      return;
    }

    if (id) {
      (async () => {
        const result = await fetchData(`commerce/products/${id}`);
        if (result?.data) {
          setLocalData(hydrateProductDetails(result.data));
          setHasChanges(false);
          setVariantErrors([]);
        }
      })();
    }
  }, [id, fetchData, defaultLang]);

  useEffect(() => {
    if (!localData) return;
    const langs = Object.keys(localData.translations);
    const sorted = [...langs].sort((a, b) =>
      a === defaultLang ? -1 : b === defaultLang ? 1 : a.localeCompare(b)
    );
    if (!langs.includes(activeLang)) {
      setActiveLang(sorted[0]);
    }
  }, [localData, defaultLang, activeLang]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent): string | void => {
      if (hasChanges) {
        e.preventDefault();
        return t("products.unsavedChanges.warning");
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges, t]);

  const closeUnsavedAlert = useCallback(() => {
    setShowUnsavedAlert(false);
  }, []);

  const confirmDiscard = useCallback(() => {
    setShowUnsavedAlert(false);
    setHasChanges(false);
    navigate(navigateTo);
  }, [navigate, navigateTo]);

  const onAddLanguage = useCallback(
    async (lang: string) => {
      if (!localData) return;

      if (localData.id && hasChanges) {
        toast.error(t("products.details.notifications.languageAddError.title"), {
          description: t(
            "products.details.notifications.languageAddError.description"
          ),
        });
        return;
      }

      if (localData.translations[lang]) {
        setActiveLang(lang);
        return;
      }

      const normalizedTranslation: ProductTranslationModel = {
        title: "",
        slug: "",
        description: "",
        summary: "",
        seo: undefined,
      };

      const optimisticData: ProductDetailsState = {
        ...localData,
        translations: {
          ...localData.translations,
          [lang]: normalizedTranslation,
        },
      };

      setLocalData(optimisticData);
      setActiveLang(lang);

      setHasChanges(true);
    },
    [hasChanges, localData, t]
  );

  const onChangeActiveLang = useCallback(
    (lang: string) => {
      if (hasChanges) {
        setNavigateTo("");
        setShowUnsavedAlert(true);
      } else {
        setActiveLang(lang);
      }
    },
    [hasChanges]
  );

  const handleNavigation = useCallback(
    (path: string) => {
      if (hasChanges) {
        setNavigateTo(path);
        setShowUnsavedAlert(true);
      } else {
        navigate(path);
      }
    },
    [hasChanges, navigate]
  );

  const onSettingsChange = useCallback(
    (
      field: "status" | "publishAt" | "expireAt" | "tags" | "collections",
      value: string | string[] | undefined
    ) => {
      setLocalData((prev) => {
        if (!prev) return prev;
        if (field === "tags" || field === "collections") {
          return {
            ...prev,
            [field]: (value as string[] | undefined) ?? [],
          };
        }
        return { ...prev, [field]: value as string | undefined };
      });
      setHasChanges(true);
    },
    []
  );

  const onChange = useCallback(
    (
      field: keyof ProductTranslationModel,
      value: string | number | boolean | string[]
    ) => {
      setLocalData((prev) => {
        if (!prev) return prev;

        const updatedTranslations = { ...prev.translations };

        // Auto-generate slug if the title is updated
        if (field === "title") {
          const slug = generateSlug(value as string);
          updatedTranslations[activeLang] = {
            ...updatedTranslations[activeLang],
            title: value as string,
            slug,
          };
        } else if (
          field === "slug" ||
          field === "description" ||
          field === "summary"
        ) {
          updatedTranslations[activeLang] = {
            ...updatedTranslations[activeLang],
            [field]: value,
          };
        } else {
          return {
            ...prev,
            [field]: value,
          };
        }

        return {
          ...prev,
          translations: updatedTranslations,
        };
      });

      setHasChanges(true);
    },
    [activeLang]
  );

  const validateForm = useCallback((): boolean => {
    if (!localData) return false;

    const errors: FormErrors = {};
    const translation = localData.translations[activeLang];

    if (!translation?.title?.trim()) {
      errors.title = t("products.errors.titleRequired", "Title is required");
    }

    if (!translation?.slug?.trim()) {
      errors.slug = t("products.errors.slugRequired", "Slug is required");
    }

    const variants = localData.variants ?? [];
    let hasVariantValidationErrors = false;
    const nextVariantErrors: VariantFieldErrors[] = variants.map(() => ({}));

    variants.forEach((variant, index) => {
      const variantError: VariantFieldErrors = {};
      if (!variant.title?.trim()) {
        variantError.title = t(
          "products.errors.variantTitleRequired",
          "Variant name is required"
        );
      }
      if (!variant.sku?.trim()) {
        variantError.sku = t(
          "products.errors.variantSkuRequired",
          "Variant SKU is required"
        );
      }

      if (Object.keys(variantError).length > 0) {
        hasVariantValidationErrors = true;
        nextVariantErrors[index] = variantError;
      }
    });

    if (hasVariantValidationErrors) {
      setVariantErrors(nextVariantErrors);
    } else {
      setVariantErrors([]);
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0 && !hasVariantValidationErrors;
  }, [localData, activeLang, t]);

  const handleSave = useCallback(async () => {
    if (!localData || !validateForm()) {
      toast.error(t("products.details.notifications.invalid.title"), {
        description: t("products.details.notifications.invalid.description"),
      });
      return;
    }

    const toastId = toast.loading(t("products.details.notifications.saving"));

    try {
      const translation = localData.translations[activeLang];
      if (!translation) {
        toast.error(
          t("products.details.notifications.missingTranslation.title"),
          {
            description: t(
              "products.details.notifications.missingTranslation.description",
              { language: activeLang }
            ),
          }
        );
        return;
      }

      const galleryAssetIds = (localData.gallery ?? [])
        .map((entry) => extractAssetId(entry))
        .filter((id): id is string => Boolean(id));

      const normalizedVariants = (localData.variants ?? []).map(
        (variant, variantIndex) => {
          const variantIdCandidate = (() => {
            const variantWithId = variant as ProductVariantModel;
            if (typeof variantWithId.id === "string" && variantWithId.id.trim()) {
              return variantWithId.id.trim();
            }

            const legacyId = (variant as { _id?: unknown })._id;

            if (typeof legacyId === "string" && legacyId.trim()) {
              return legacyId.trim();
            }

            return undefined;
          })();

          const normalizedPrices = (variant.prices ?? []).map((price) => ({
            currencyCode: price.currencyCode ?? defaultCurrency,
            amount:
              typeof price.amount === "number" && !Number.isNaN(price.amount)
                ? price.amount
                : 0,
            compareAtAmount:
              typeof price.compareAtAmount === "number" &&
              !Number.isNaN(price.compareAtAmount)
                ? price.compareAtAmount
                : undefined,
          }));

          const gallery = (variant.gallery ?? []).filter(
            (id): id is string => typeof id === "string" && Boolean(id)
          );

          const optionName = variant.optionName?.trim() || "default";
          const optionValue =
            variant.optionValue?.trim() || `${optionName}-${variantIndex + 1}`;

          return {
            id: variantIdCandidate,
            title: variant.title ?? "",
            sku: variant.sku ?? "",
            barcode: variant.barcode,
            inventoryQuantity:
              typeof variant.inventoryQuantity === "number"
                ? Math.max(0, Math.trunc(variant.inventoryQuantity))
                : undefined,
            allowBackorder: Boolean(variant.allowBackorder),
            prices: normalizedPrices,
            gallery,
            downloadUrl: variant.downloadUrl,
            optionName,
            optionValue,
          } satisfies ProductVariantModel;
        }
      );

      const body: ProductUpsertModel = {
        id: id && id !== "create" ? localData.id : undefined,
        language: activeLang,
        status: localData.status,
        slug: localData.translations[activeLang].slug,
        title: localData.translations[activeLang].title,
        summary: localData.translations[activeLang].summary,
        description: localData.translations[activeLang].description,
        isDigital: localData.isDigital,
        tags: localData.tags,
        seo: localData.translations[activeLang].seo,
        publishAt: localData.publishAt,
        expireAt: localData.expireAt,
        collections: localData.collections ?? null,
        gallery: galleryAssetIds,
        thumbnail: localData.thumbnail ?? undefined,
        variants: normalizedVariants,
      };

      const result = await fetchData("commerce/products", "POST", body);

      if (result?.data) {
        toast.success(
          t(
            `products.details.notifications.${
              id === "create" ? "created" : "saved"
            }`
          ),
          {
            id: toastId,
            description: t("products.details.notifications.title", {
              title: translation.title,
            }),
          }
        );

        setLocalData(hydrateProductDetails(result.data));
        setHasChanges(false);
        setFormErrors({});
        setVariantErrors([]);

        if (id === "create") {
          navigate(`/commerce/products/${result.data.id}`);
        }
      } else {
        toast.error(t("products.details.notifications.saveError.title"), {
          id: toastId,
          description: t("products.details.notifications.saveError.noData"),
        });
      }
    } catch (error) {
      console.error("Save failed:", error);
      toast.error(t("products.details.notifications.saveError.title"), {
        id: toastId,
        description: t(
          "products.errors.saveFailed",
          "Failed to save collection. Please try again."
        ),
      });
      setFormErrors({
        apiError: t(
          "products.errors.saveFailed",
          "Failed to save collection. Please try again."
        ),
      });
    }
  }, [
    localData,
    activeLang,
    id,
    fetchData,
    navigate,
    t,
    validateForm,
    defaultCurrency,
  ]);

  const onSeoChange = useCallback(
    <K extends keyof ProductSeoModel>(
      lang: string,
      field: K,
      value: ProductSeoModel[K]
    ) => {
      setLocalData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          translations: {
            ...prev.translations,
            [lang]: {
              ...prev.translations[lang],
              seo: {
                ...prev.translations[lang].seo,
                [field]: value,
              },
            },
          },
        };
      });
      setHasChanges(true);
    },
    []
  );

  const onMediaChange = useCallback(
    async (
      value: { gallery: string[]; thumbnail: string | null },
      options?: { force?: boolean }
    ) => {
      setFormErrors((prev) => ({ ...prev, thumbnail: undefined }));
      if (!localData) return;

      const nextGallery = value.gallery ?? [];
      const nextThumbnail = value.thumbnail ?? null;

      const normalizedNextGallery = nextGallery.filter((id) => Boolean(id));
      const currentGalleryIds = (localData.gallery ?? [])
        .map((entry) => extractAssetId(entry))
        .filter((id): id is string => Boolean(id));
      const currentThumbnail = localData.thumbnail ?? null;

      if (
        arraysEqual(currentGalleryIds, normalizedNextGallery) &&
        currentThumbnail === nextThumbnail &&
        !options?.force
      ) {
        return;
      }

      const allowedGalleryIds = new Set(normalizedNextGallery);
      const sanitizedVariants = (localData.variants ?? []).map((variant) => ({
        ...variant,
        gallery: (variant.gallery ?? []).filter((assetId): assetId is string =>
          typeof assetId === "string" && allowedGalleryIds.has(assetId)
        ),
      }));

      const updatedData: ProductDetailsState = {
        ...localData,
        gallery: mapAssetIdsToSources(
          normalizedNextGallery,
          localData.gallery ?? []
        ),
        thumbnail: nextThumbnail,
        variants: sanitizedVariants,
      };

      setLocalData(updatedData);

      if (!updatedData.id) {
        setHasChanges(true);
        return;
      }

      const translationEntry = findTranslationForUpsert(
        updatedData,
        activeLang,
        defaultLang
      );

      if (!translationEntry) {
        setHasChanges(true);
        toast.error(
          t("products.details.media.syncError.title", "Unable to update media"),
          {
            description: t(
              "products.details.media.syncError.description",
              "We couldn't attach the latest files. Try saving the product manually."
            ),
          }
        );
        return;
      }

      const { lang, translation } = translationEntry;

      const body: ProductUpsertModel = {
        id: updatedData.id,
        language: lang,
        status: updatedData.status,
        slug: translation.slug,
        title: translation.title,
        summary: translation.summary,
        description: translation.description,
        seo: translation.seo,
        isDigital: updatedData.isDigital,
        tags: updatedData.tags,
        publishAt: updatedData.publishAt,
        expireAt: updatedData.expireAt,
        collections: updatedData.collections ?? [],
        gallery: normalizedNextGallery,
        thumbnail: nextThumbnail ?? undefined,
      };

      try {
        const result = await fetchData("commerce/products", "POST", body);
        if (result?.data) {
          setLocalData(hydrateProductDetails(result.data));
        }
      } catch (error) {
        console.error("Failed to sync product media", error);
        toast.error(t("products.details.media.syncError.title"), {
          description: t("products.details.media.syncError.description"),
        });
        setHasChanges(true);
        throw error;
      }
    },
    [activeLang, defaultLang, fetchData, localData, t]
  );

  const onVariantChange = useCallback(
    (
      index: number,
      field:
        | "title"
        | "sku"
        | "barcode"
        | "inventoryQuantity"
        | "allowBackorder",
      value: string | number | boolean | undefined
    ) => {
      setLocalData((prev) => {
        if (!prev) return prev;
        const variants = [...(prev.variants ?? [])];
        const current = variants[index];
        if (!current) return prev;

        const updated = { ...current } as typeof current;

        switch (field) {
          case "title":
          case "sku":
          case "barcode":
            updated[field] = (value as string) ?? "";
            break;
          case "inventoryQuantity": {
            const numericValue =
              typeof value === "number"
                ? value
                : value === undefined
                  ? undefined
                  : Number(value);

            updated.inventoryQuantity =
              numericValue === undefined || Number.isNaN(numericValue)
                ? 0
                : Math.max(0, Math.trunc(numericValue));
            break;
          }
          case "allowBackorder":
            updated.allowBackorder = Boolean(value);
            break;
        }

        variants[index] = updated;
        return { ...prev, variants };
      });
      setVariantErrors((prev) => {
        if (!prev.length) return prev;
        const current = prev[index];
        if (!current) return prev;
        if (
          field !== "title" &&
          field !== "sku" &&
          field !== "inventoryQuantity"
        ) {
          return prev;
        }

        if (!current[field]) {
          return prev;
        }

        const next = [...prev];
        const updatedErrors = { ...current } as VariantFieldErrors;
        delete updatedErrors[field];
        next[index] = Object.keys(updatedErrors).length ? updatedErrors : {};
        return next;
      });
      setHasChanges(true);
    },
    []
  );

  const onVariantPriceChange = useCallback(
    (index: number, field: keyof ProductPriceModel, value: string) => {
      setLocalData((prev) => {
        if (!prev) return prev;
        const variants = [...(prev.variants ?? [])];
        const current = variants[index];
        if (!current) return prev;

        const prices = [...(current.prices ?? [])];
        const primary = {
          currencyCode: defaultCurrency,
          amount: 0,
          compareAtAmount: undefined as number | undefined,
          ...prices[0],
        };

        if (field === "currencyCode") {
          primary.currencyCode = value
            ? value.trim().toUpperCase().slice(0, 3)
            : defaultCurrency;
        }

        if (field === "amount") {
          const parsed = Number.parseFloat(value);
          primary.amount = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
        }

        if (field === "compareAtAmount") {
          const parsed = Number.parseFloat(value);
          primary.compareAtAmount = Number.isNaN(parsed)
            ? undefined
            : Math.max(0, parsed);
        }

        prices[0] = primary;
        variants[index] = { ...current, prices };
        return { ...prev, variants };
      });
      setHasChanges(true);
    },
    [defaultCurrency]
  );

  const onVariantGalleryChange = useCallback(
    (index: number, gallery: string[]) => {
      setLocalData((prev) => {
        if (!prev) return prev;
        const variants = [...(prev.variants ?? [])];
        const current = variants[index];
        if (!current) return prev;

        variants[index] = {
          ...current,
          gallery,
        };

        return { ...prev, variants };
      });

      setVariantErrors((prev) => {
        if (!prev.length) return prev;
        const current = prev[index];
        if (!current?.gallery) return prev;
        const next = [...prev];
        const updated = { ...current } as VariantFieldErrors;
        delete updated.gallery;
        next[index] = Object.keys(updated).length ? updated : {};
        return next;
      });

      setHasChanges(true);
    },
    []
  );

  const onAddVariant = useCallback(() => {
    let didAdd = false;
    setLocalData((prev) => {
      if (!prev) return prev;

      const variant: ProductDetailsState["variants"][number] = {
        id: undefined,
        title: "",
        sku: "",
        barcode: "",
        prices: [
          {
            currencyCode: defaultCurrency,
            amount: 0,
          },
        ],
        inventoryQuantity: 0,
        allowBackorder: false,
        gallery: [],
        optionName: "default",
        optionValue: `default-${Date.now()}`,
      } as ProductDetailsState["variants"][number];

      didAdd = true;

      return {
        ...prev,
        variants: [...(prev.variants ?? []), variant],
      };
    });
    if (didAdd) {
      setVariantErrors((prev) => [...prev, {}]);
    }
    setHasChanges(true);
  }, [defaultCurrency]);

  const onRemoveVariant = useCallback((index: number) => {
    let didRemove = false;
    setLocalData((prev) => {
      if (!prev) return prev;
      const variants = [...(prev.variants ?? [])];
      if (!variants[index]) return prev;
      variants.splice(index, 1);
      didRemove = true;
      return { ...prev, variants };
    });
    if (didRemove) {
      setVariantErrors((prev) => {
        if (!prev.length) return prev;
        const next = [...prev];
        next.splice(index, 1);
        return next;
      });
    }
    setHasChanges(true);
  }, []);

  const variantGalleryOptions = useMemo<VariantGalleryOption[]>(() => {
    if (!localData) return [];

    const languages = [activeLang, defaultLang].filter(
      (lang): lang is string => Boolean(lang)
    );

    return (localData.gallery ?? [])
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

        const localizedLabel = languages.reduce<string | undefined>(
          (acc, lang) => {
            if (acc) return acc;
            const title = entry.title?.[lang]?.trim();
            if (title) return title;
            const alt = entry.alt?.[lang]?.trim();
            if (alt) return alt;
            return acc;
          },
          undefined
        );

        return {
          id: assetId,
          label:
            localizedLabel ?? entry.name ?? entry.path ?? assetId ?? "",
          url: entry.url ?? null,
        } satisfies VariantGalleryOption;
      })
      .filter((option): option is VariantGalleryOption => option !== null);
  }, [localData, activeLang, defaultLang]);

  return {
    data: localData,
    loading,
    activeLang,
    setActiveLang: onChangeActiveLang,
    onAddLanguage,
    onSettingsChange,
    confirmDiscard,
    hasChanges,
    handleNavigation,
    handleSave,
    onChange,
    onSeoChange,
    onMediaChange,
    closeUnsavedAlert,
    showUnsavedAlert,
    formErrors,
    t,
    defaultCurrency,
    onVariantChange,
    onVariantPriceChange,
    onVariantGalleryChange,
    onAddVariant,
    onRemoveVariant,
    variantErrors,
    variantGalleryOptions,
  };
}
