import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  type ProductSeoModel,
  ProductStatus,
  type ProductResponseModel,
} from "@kitejs-cms/plugin-commerce-api";
import {
  useApi,
  useBreadcrumb,
  useSettingsContext,
} from "@kitejs-cms/dashboard-core";

export type ProductTranslationModel = {
  title: string;
  subtitle?: string;
  summary?: string;
  description?: string;
  slug?: string;
  seo?: ProductSeoModel;
};

export type ProductResponseDetailsModel = ProductResponseModel & {
  status?: string;
  tags?: string[];
  publishAt?: string | null;
  expireAt?: string | null;
  defaultCurrency?: string;
  thumbnail?: string | null;
  gallery?: string[];
  createdBy?: string;
  updatedBy?: string;
  collectionIds?: string[];
  translations: Record<string, ProductTranslationModel>;
  slugs?: Record<string, string>;
  [key: string]: unknown;
};

export interface ProductFormErrors {
  title?: string;
  slug?: string;
  apiError?: string;
  [key: string]: string | undefined;
}

function normalizeTranslation(
  language: string,
  value: Record<string, unknown> | undefined,
  fallbackSlug: string | undefined
): ProductTranslationModel {
  const translation = (value ?? {}) as ProductTranslationModel;

  return {
    title: translation.title ?? "",
    subtitle: translation.subtitle ?? "",
    summary: translation.summary ?? "",
    description: translation.description ?? "",
    slug: translation.slug ?? fallbackSlug ?? "",
    seo: {
      metaTitle: translation.seo?.metaTitle ?? "",
      metaDescription: translation.seo?.metaDescription ?? "",
      metaKeywords: translation.seo?.metaKeywords ?? [],
      canonicalUrl: translation.seo?.canonicalUrl ?? "",
    },
  };
}

function normalizeProduct(
  product: ProductResponseDetailsModel
): ProductResponseDetailsModel {
  const languages = Object.keys(product.translations ?? {});
  const slugs = product.slugs ?? {};

  const translations = languages.reduce<Record<string, ProductTranslationModel>>(
    (acc, lang) => {
      acc[lang] = normalizeTranslation(
        lang,
        product.translations?.[lang] as Record<string, unknown>,
        slugs[lang]
      );
      return acc;
    },
    {}
  );

  return {
    ...product,
    status: product.status ?? ProductStatus.Draft,
    tags: Array.isArray(product.tags) ? product.tags : [],
    publishAt: product.publishAt ?? null,
    expireAt: product.expireAt ?? null,
    defaultCurrency: product.defaultCurrency ?? "",
    thumbnail: product.thumbnail ?? "",
    gallery: Array.isArray(product.gallery) ? product.gallery : [],
    translations,
    slugs,
  };
}

export function useProductDetails() {
  const { t } = useTranslation("commerce");
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { setBreadcrumb } = useBreadcrumb();
  const { cmsSettings } = useSettingsContext();

  const defaultLang = useMemo(
    () => cmsSettings?.defaultLanguage || "en",
    [cmsSettings]
  );

  const isCreating = location.pathname.endsWith("/new") || id === "new";

  const { loading, fetchData } = useApi<ProductResponseDetailsModel>();

  const [localData, setLocalData] =
    useState<ProductResponseDetailsModel | null>(null);
  const [activeLang, setActiveLang] = useState(defaultLang);
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
  const [navigateTo, setNavigateTo] = useState("");
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});

  useEffect(() => {
    const items = [
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.products"), path: "/commerce/products" },
    ];

    if (!isCreating && id && localData) {
      const current = localData.translations?.[activeLang];
      const label = current?.title?.trim() || current?.slug?.trim();
      if (label) {
        items.push({ label, path: `/commerce/products/${localData.id}` });
      }
    } else if (isCreating) {
      items.push({
        label: t("products.create.breadcrumb"),
        path: "/commerce/products/new",
      });
    }

    setBreadcrumb(items);
  }, [
    activeLang,
    id,
    isCreating,
    localData,
    setBreadcrumb,
    t,
  ]);

  useEffect(() => {
    setActiveLang(defaultLang);
  }, [defaultLang]);

  useEffect(() => {
    if (!defaultLang) return;

    if (isCreating) {
      const newProduct: ProductResponseDetailsModel = {
        id: "",
        slugs: {},
        translations: {
          [defaultLang]: {
            title: "",
            subtitle: "",
            summary: "",
            description: "",
            slug: "",
            seo: {
              metaTitle: "",
              metaDescription: "",
              metaKeywords: [],
              canonicalUrl: "",
            },
          },
        },
        status: ProductStatus.Draft,
        tags: [],
        publishAt: null,
        expireAt: null,
        defaultCurrency: "EUR",
        thumbnail: "",
        gallery: [],
        createdBy: "",
        updatedBy: "",
      } as ProductResponseDetailsModel;

      setLocalData(newProduct);
      setActiveLang(defaultLang);
      setHasChanges(false);
      return;
    }

    if (id) {
      void (async () => {
        const result = await fetchData(`commerce/products/${id}`);
        if (result?.data) {
          setLocalData(normalizeProduct(result.data));
          setHasChanges(false);
          setFormErrors({});
        }
      })();
    }
  }, [defaultLang, fetchData, id, isCreating]);

  useEffect(() => {
    if (!localData) return;
    const langs = Object.keys(localData.translations ?? {});
    if (!langs.length) return;
    const sorted = [...langs].sort((a, b) =>
      a === defaultLang ? -1 : b === defaultLang ? 1 : a.localeCompare(b)
    );
    if (!langs.includes(activeLang)) {
      setActiveLang(sorted[0]);
    }
  }, [activeLang, defaultLang, localData]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent): string | void => {
      if (hasChanges) {
        event.preventDefault();
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
    if (navigateTo) {
      navigate(navigateTo);
    }
  }, [navigate, navigateTo]);

  const onAddLanguage = useCallback((lang: string) => {
    setLocalData((prev) => {
      if (!prev) return prev;
      if (prev.translations?.[lang]) {
        setActiveLang(lang);
        return prev;
      }
      const empty: ProductTranslationModel = {
        title: "",
        subtitle: "",
        summary: "",
        description: "",
        slug: "",
        seo: {
          metaTitle: "",
          metaDescription: "",
          metaKeywords: [],
          canonicalUrl: "",
        },
      };
      setActiveLang(lang);
      setHasChanges(true);
      return {
        ...prev,
        translations: { ...prev.translations, [lang]: empty },
        slugs: { ...(prev.slugs ?? {}), [lang]: "" },
      };
    });
  }, []);

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
      field:
        | "status"
        | "publishAt"
        | "expireAt"
        | "tags"
        | "defaultCurrency"
        | "thumbnail"
        | "gallery",
      value: string | string[] | null
    ) => {
      setLocalData((prev) => {
        if (!prev) return prev;
        if (field === "tags" || field === "gallery") {
          return { ...prev, [field]: (value ?? []) as string[] };
        }
        return { ...prev, [field]: value as string | null };
      });
      setHasChanges(true);
    },
    []
  );

  const generateSlug = useCallback((title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }, []);

  const onChange = useCallback(
    (
      field: keyof ProductTranslationModel,
      value: string | number | boolean | string[]
    ) => {
      setLocalData((prev) => {
        if (!prev) return prev;
        const current = prev.translations?.[activeLang] ?? {
          title: "",
          subtitle: "",
          summary: "",
          description: "",
          slug: "",
          seo: {
            metaTitle: "",
            metaDescription: "",
            metaKeywords: [],
            canonicalUrl: "",
          },
        };

        const updatedTranslations = {
          ...prev.translations,
          [activeLang]: { ...current },
        };

        const updatedSlugs = { ...(prev.slugs ?? {}) };

        if (field === "title") {
          const newTitle = value as string;
          const slug = generateSlug(newTitle);
          updatedTranslations[activeLang] = {
            ...updatedTranslations[activeLang],
            title: newTitle,
            slug,
          };
          updatedSlugs[activeLang] = slug;
        } else if (field === "slug") {
          const slugValue = String(value);
          updatedTranslations[activeLang] = {
            ...updatedTranslations[activeLang],
            slug: slugValue,
          };
          updatedSlugs[activeLang] = slugValue;
        } else {
          updatedTranslations[activeLang] = {
            ...updatedTranslations[activeLang],
            [field]: value,
          };
        }

        return {
          ...prev,
          translations: updatedTranslations,
          slugs: updatedSlugs,
        };
      });

      setHasChanges(true);
    },
    [activeLang, generateSlug]
  );

  const onSeoChange = useCallback(
    <K extends keyof ProductSeoModel>(
      lang: string,
      field: K,
      value: ProductSeoModel[K]
    ) => {
      setLocalData((prev) => {
        if (!prev) return prev;
        const current = prev.translations?.[lang] ?? {
          title: "",
          subtitle: "",
          summary: "",
          description: "",
          slug: "",
        };
        return {
          ...prev,
          translations: {
            ...prev.translations,
            [lang]: {
              ...current,
              seo: {
                metaTitle: current.seo?.metaTitle ?? "",
                metaDescription: current.seo?.metaDescription ?? "",
                metaKeywords: current.seo?.metaKeywords ?? [],
                canonicalUrl: current.seo?.canonicalUrl ?? "",
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

  const validateForm = useCallback(() => {
    if (!localData) return false;
    const errors: ProductFormErrors = {};
    const translation = localData.translations?.[activeLang];

    if (!translation?.title?.trim()) {
      errors.title = t("products.errors.titleRequired", "Title is required");
    }

    if (!translation?.slug?.trim()) {
      errors.slug = t("products.errors.slugRequired", "Slug is required");
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [activeLang, localData, t]);

  const handleSave = useCallback(async () => {
    if (!localData || !validateForm()) {
      toast.error(t("products.errors.formInvalid", "Invalid form"), {
        description: t(
          "products.errors.formInvalidDescription",
          "Check the required fields and try again."
        ),
      });
      return;
    }

    const translation = localData.translations?.[activeLang];
    if (!translation) {
      toast.error(
        t("products.errors.missingTranslation", "Missing translation"),
        {
          description: t("products.errors.translationMissingDescription", {
            defaultValue: "The selected language is not configured.",
            language: activeLang,
          }),
        }
      );
      return;
    }

    const toastId = toast.loading(
      t("products.details.notifications.saving", "Saving product...")
    );

    try {
      const payload = {
        slug: translation.slug ?? "",
        language: activeLang,
        status: (localData.status as string) ?? ProductStatus.Draft,
        title: translation.title,
        subtitle: translation.subtitle ?? undefined,
        summary: translation.summary ?? undefined,
        description: translation.description ?? undefined,
        seo: translation.seo,
        tags: localData.tags ?? [],
        publishAt: localData.publishAt ?? undefined,
        expireAt: localData.expireAt ?? undefined,
        defaultCurrency: localData.defaultCurrency ?? undefined,
        thumbnail: localData.thumbnail ?? undefined,
        gallery: localData.gallery ?? [],
        collectionIds: (localData.collectionIds ?? undefined) as
          | string[]
          | undefined,
      };

      const endpoint = isCreating
        ? "commerce/products"
        : `commerce/products/${localData.id}`;
      const method = isCreating ? "POST" : "PATCH";

      const result = await fetchData(endpoint, method, payload);

      if (result?.data) {
        const normalized = normalizeProduct(result.data);
        setLocalData(normalized);
        setHasChanges(false);
        setFormErrors({});

        toast.success(
          t(
            `products.details.notifications.${
              isCreating ? "created" : "saved"
            }`
          ),
          {
            id: toastId,
            description: t("products.details.notifications.title", {
              title: translation.title,
            }),
          }
        );

        if (isCreating && normalized.id) {
          navigate(`/commerce/products/${normalized.id}`);
        }
      } else {
        toast.error(t("products.errors.saveFailed"), {
          id: toastId,
          description: t(
            "products.errors.saveFailedDescription",
            "No response received from the server."
          ),
        });
      }
    } catch (error) {
      console.error("Failed to save product", error);
      toast.error(t("products.errors.saveFailed"), {
        id: toastId,
        description: t(
          "products.errors.saveFailedDescription",
          "Unable to save the product. Please try again."
        ),
      });
      setFormErrors({
        apiError: t(
          "products.errors.saveFailedDescription",
          "Unable to save the product. Please try again."
        ),
      });
    }
  }, [
    activeLang,
    fetchData,
    isCreating,
    localData,
    navigate,
    t,
    validateForm,
  ]);

  return {
    data: localData,
    loading,
    activeLang,
    setActiveLang: onChangeActiveLang,
    onAddLanguage,
    onChange,
    onSeoChange,
    onSettingsChange,
    hasChanges,
    handleNavigation,
    handleSave,
    showUnsavedAlert,
    confirmDiscard,
    closeUnsavedAlert,
    formErrors,
  };
}
