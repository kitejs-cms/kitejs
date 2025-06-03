import { useSettingsContext } from "../../../context/settings-context";
import { useBreadcrumb } from "../../../context/breadcrumb-context";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApi } from "../../../hooks/use-api";
import { toast } from "sonner";
import type {
  PageBlockModel,
  PageResponseDetailsModel,
  PageSeoModel,
  PageTranslationModel,
  PageUpsertModel,
} from "@kitejs-cms/core/index";

export interface FormErrors {
  title?: string;
  content?: string;
  apiError?: string;
  [key: string]: string | undefined;
}

export function usePageDetails(type: "Page" | "Post") {
  const { t } = useTranslation("pages");
  const navigate = useNavigate();
  const { cmsSettings } = useSettingsContext();
  const { setBreadcrumb } = useBreadcrumb();

  const defaultLang = useMemo(
    () => cmsSettings?.defaultLanguage || "",
    [cmsSettings]
  );

  const { loading, fetchData } = useApi<PageResponseDetailsModel>();
  const { id } = useParams<{ id: string }>();

  const [localData, setLocalData] = useState<PageResponseDetailsModel | null>(
    null
  );
  const [activeLang, setActiveLang] = useState(defaultLang);
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
  const [navigateTo, setNavigateTo] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    const items = [{ label: t("breadcrumb.home"), path: "/" }]

    if (type === "Page") {
      items.push({ label: t("breadcrumb.pages"), path: "/pages" },)
    } else {
      items.push({ label: t("breadcrumb.articles"), path: "/articles" },)
    }


    if (id && localData && localData?.translations[activeLang]?.slug) {
      const basePath = type === "Page" ? "pages" : "articles"

      items.push({
        label: localData.translations[activeLang].slug,
        path: `/${basePath}/${localData.id}`,
      });
    }

    setBreadcrumb(items);
  }, [activeLang, id, localData, setBreadcrumb, t, type]);

  useEffect(() => {
    if (!defaultLang) return;

    if (id === "create") {
      const newPage: PageResponseDetailsModel = {
        status: "Draft" as never,
        tags: [],
        publishAt: new Date().toISOString(),
        categories: [],
        expireAt: null,
        image: null,
        translations: {
          [defaultLang]: {
            title: "",
            description: "",
            slug: "",
            blocks: [],
            seo: {
              metaTitle: "",
              metaDescription: "",
              metaKeywords: [],
              canonical: "",
            },
          },
        },
        createdBy: "",
        updatedBy: "",
        createdAt: "",
        updatedAt: "",
        id: "",
      };
      setLocalData(newPage);
      setActiveLang(defaultLang);
      return;
    }

    if (id) {
      (async () => {
        const result = await fetchData(`pages/${id}`);
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

  const validateForm = useCallback((): boolean => {
    if (!localData) return false;

    const errors: FormErrors = {};
    const translation = localData.translations[activeLang];

    if (!translation?.title?.trim()) {
      errors.title = t("errors.titleRequired", "Title is required");
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [localData, activeLang, t]);

  const validateField = useCallback(
    (field: string, value: string) => {
      if (!value.trim()) {
        setFormErrors((prev) => ({
          ...prev,
          [field]: t(`errors.${field}Required`, `${field} is required`),
        }));
      } else {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [t]
  );

  const onContentChange = useCallback(
    (lang: string, field: keyof PageTranslationModel, value: string) => {
      if (field === "title") {
        validateField("title", value);
      }

      setLocalData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          translations: {
            ...prev.translations,
            [lang]: {
              ...prev.translations[lang],
              [field]: value,
            },
          },
        };
      });
      setHasChanges(true);
    },
    [validateField]
  );

  const onSeoChange = useCallback(
    <K extends keyof PageSeoModel>(
      lang: string,
      field: K,
      value: PageSeoModel[K]
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

  const onSettingsChange = useCallback(
    (
      field: "status" | "publishAt" | "expireAt" | "tags" | "categories" | "image",
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

  const closeUnsavedAlert = useCallback(() => {
    setShowUnsavedAlert(false);
  }, []);

  const confirmDiscard = useCallback(() => {
    setShowUnsavedAlert(false);
    setHasChanges(false);
    navigate(navigateTo);
  }, [navigate, navigateTo]);

  const handleSave = useCallback(
    async (blocks?: PageBlockModel[]) => {
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

        const body: PageUpsertModel = {
          type,
          id: id && id !== "create" ? localData.id : undefined,
          tags: localData.tags,
          status: localData.status,
          publishAt: localData.publishAt,
          expireAt: localData.expireAt,
          slug: translation.slug,
          language: activeLang,
          title: translation.title,
          description: translation.description,
          blocks: blocks ?? translation.blocks,
          seo: translation.seo,
          categories: localData.categories,
          image: localData.image,
        };

        const result = await fetchData("pages", "POST", body);

        if (result?.data) {
          toast.success(
            id === "create" ? "Pagina creata" : "Pagina aggiornata",
            {
              id: toastId,
              description: `Titolo: ${translation.title}`,
            }
          );

          setLocalData(result.data);
          setHasChanges(false);
          setFormErrors({});

          if (id === "create") {
            if (type === "Page") navigate(`/pages/${result.data.id}`);
            if (type === "Post") navigate(`/articles/${result.data.id}`);
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
    },
    [localData, activeLang, id, fetchData, navigate, t, validateForm, type]
  );

  const onAddLanguage = useCallback((lang: string) => {
    setLocalData((prev) => {
      if (!prev) return prev;
      if (prev.translations[lang]) {
        setActiveLang(lang);
        return prev;
      }
      const empty: PageTranslationModel = {
        title: "",
        description: "",
        slug: "",
        blocks: [],
        seo: {
          metaTitle: "",
          metaDescription: "",
          metaKeywords: [],
          canonical: "",
        },
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

  return {
    data: localData,
    loading,
    activeLang,
    setActiveLang: onChangeActiveLang,
    onAddLanguage,
    hasChanges,
    onContentChange,
    onSeoChange,
    onSettingsChange,
    showUnsavedAlert,
    handleNavigation,
    closeUnsavedAlert,
    confirmDiscard,
    handleSave,
    formErrors,
  };
}
