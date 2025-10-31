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
} from "@kitejs-cms/plugin-commerce-api";
import type { MediaSource } from "./use-product-media";

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

  const { loading, fetchData } = useApi<ProductResponseDetailsModel>();
  const { id } = useParams<{ id: string }>();

  const [activeLang, setActiveLang] = useState(defaultLang);
  const [hasChanges, setHasChanges] = useState(false);
  const [navigateTo, setNavigateTo] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);

  const [localData, setLocalData] = useState<ProductDetailsState | null>(null);

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
      return;
    }

    if (id) {
      (async () => {
        const result = await fetchData(`commerce/products/${id}`);
        if (result?.data) {
          setLocalData(hydrateProductDetails(result.data));
          setHasChanges(false);
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

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
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
  }, [localData, activeLang, id, fetchData, navigate, t, validateForm]);

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

      const updatedData: ProductDetailsState = {
        ...localData,
        gallery: mapAssetIdsToSources(
          normalizedNextGallery,
          localData.gallery ?? []
        ),
        thumbnail: nextThumbnail,
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
  };
}
