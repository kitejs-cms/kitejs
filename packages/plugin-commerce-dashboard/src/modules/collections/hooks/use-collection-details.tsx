import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  CollectionSeoModel,
  type CollectionResponseDetailslModel,
  type CollectionTranslationModel,
  type CollectionUpsertModel,
} from "@kitejs-cms/plugin-commerce-api";
import {
  useApi,
  useBreadcrumb,
  useSettingsContext,
} from "@kitejs-cms/dashboard-core";

export interface FormErrors {
  title?: string;
  slug?: string;
  apiError?: string;
  [key: string]: string | undefined;
}

export function useCollectionDetails() {
  const { t } = useTranslation("posts");
  const navigate = useNavigate();
  const { cmsSettings } = useSettingsContext();
  const { setBreadcrumb } = useBreadcrumb();
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [navigateTo, setNavigateTo] = useState("");

  const defaultLang = useMemo(
    () => cmsSettings?.defaultLanguage || "",
    [cmsSettings]
  );

  const { loading, fetchData } = useApi<CollectionResponseDetailslModel>();
  const { id } = useParams<{ id: string }>();

  const [localData, setLocalData] =
    useState<CollectionResponseDetailslModel | null>(null);

  const [activeLang, setActiveLang] = useState(defaultLang);
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);

  useEffect(() => {
    const items = [
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.collections"), path: "/collections" },
    ];

    if (id && localData && localData?.translations[activeLang]?.slug)
      items.push({
        label: localData.translations[activeLang].slug,
        path: `/commerce/collections/${localData.id}`,
      });

    setBreadcrumb(items);
  }, [activeLang, id, localData, setBreadcrumb, t]);

  useEffect(() => {
    if (!defaultLang) return;

    if (id === "create") {
      const newCollection: CollectionResponseDetailslModel = {
        id: "",
        translations: {
          [defaultLang]: {
            title: "",
            description: "",
            slug: "",
          },
        },
        createdBy: "",
        updatedBy: "",
        createdAt: undefined,
        updatedAt: undefined,
        parent: undefined,
        tags: [],
        status: "Draft" as never,
      };

      setLocalData(newCollection);
      setActiveLang(defaultLang);
      return;
    }

    if (id) {
      (async () => {
        const result = await fetchData(`commerce/collections/${id}`);
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
        return t("unsaved_changes_warning");
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
      const empty: CollectionTranslationModel = {
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
      field: "status" | "publishAt" | "expireAt" | "tags" | "parent",
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
      field: keyof CollectionTranslationModel,
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
        } else if (field in updatedTranslations[activeLang]) {
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
      errors.title = t("errors.titleRequired", "Title is required");
    }

    if (!translation?.slug?.trim()) {
      errors.slug = t("errors.slugRequired", "Title is required");
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

      const body: CollectionUpsertModel = {
        id: id && id !== "create" ? localData.id : undefined,
        language: activeLang,
        status: localData.status,
        slug: localData.translations[activeLang].slug,
        title: localData.translations[activeLang].title,
        tags: localData.tags,
        seo: localData.translations[activeLang].seo,
        parent: localData.parent ?? null,
      };

      const result = await fetchData("commerce/collections", "POST", body);

      if (result?.data) {
        toast.success(
          id === "create" ? "Categoria creata" : "Categoria aggiornata",
          {
            id: toastId,
            description: `Titolo: ${translation.title}`,
          }
        );

        setLocalData(result.data);
        setHasChanges(false);
        setFormErrors({});

        if (id === "create") {
          navigate(`/collections/${result.data.id}`);
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
          "errors.saveFailed",
          "Failed to save page. Please try again."
        ),
      });
      setFormErrors({
        apiError: t(
          "errors.saveFailed",
          "Failed to save page. Please try again."
        ),
      });
    }
  }, [localData, activeLang, id, fetchData, navigate, t, validateForm]);

  const onSeoChange = useCallback(
    <K extends keyof CollectionSeoModel>(
      lang: string,
      field: K,
      value: CollectionSeoModel[K]
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
