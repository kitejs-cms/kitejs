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

export interface FormErrors {
  title?: string;
  slug?: string;
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

  const [localData, setLocalData] =
    useState<ProductResponseDetailsModel | null>(null);

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
      const newProduct: ProductResponseDetailsModel = {
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
          setLocalData(result.data);
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

  const onAddLanguage = useCallback((lang: string) => {
    setLocalData((prev) => {
      if (!prev) return prev;
      if (prev.translations[lang]) {
        setActiveLang(lang);
        return prev;
      }
      const empty: ProductTranslationModel = {
        title: "",
        description: "",
        slug: "",
      };
      setActiveLang(lang);
      setHasChanges(true);
      return {
        ...prev,
        translations: { ...prev.translations, [lang]: empty },
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
      field: "status" | "publishAt" | "expireAt" | "tags" | "collections",
      value: string | string[]
    ) => {
      setLocalData((prev) => {
        if (!prev) return prev;
        if (field === "tags") {
          return { ...prev, tags: value as string[] };
        }
        return { ...prev, [field]: value as string };
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

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, "-");
  };

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
      toast.error("Form non valido", {
        description: "Controlla i campi obbligatori",
      });
      return;
    }

    const toastId = toast.loading("Salvataggio in corso...");

    try {
      const translation = localData.translations[activeLang];
      if (!translation) {
        toast.error("Traduzione mancante", {
          description: `Lingua ${activeLang} non configurata`,
        });
        return;
      }

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

        setLocalData(result.data);
        setHasChanges(false);
        setFormErrors({});

        if (id === "create") {
          navigate(`/commerce/products/${result.data.id}`);
        }
      } else {
        toast.error("Errore nel salvataggio", {
          id: toastId,
          description: "Nessun dato ricevuto dal server",
        });
      }
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Errore nel salvataggio", {
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
    closeUnsavedAlert,
    showUnsavedAlert,
    formErrors,
  };
}
