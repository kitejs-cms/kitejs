import { useSettingsContext } from "../../../context/settings-context";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApi } from "../../../hooks/use-api";
import { toast } from "sonner";
import type {
  CategoryResponseDetailsModel,
  CategoryTranslationModel,
  CategoryUpsertModel,
} from "@kitejs-cms/core/index";
import { useBreadcrumb } from "../../../context/breadcrumb-context";

export interface FormErrors {
  title?: string;
  slug?: string;
  apiError?: string;
  [key: string]: string | undefined;
}

export function useCategoryDetails() {
  const { t } = useTranslation("posts");
  const navigate = useNavigate();
  const { cmsSettings } = useSettingsContext();
  const { setBreadcrumb } = useBreadcrumb();
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const defaultLang = useMemo(
    () => cmsSettings?.defaultLanguage || "",
    [cmsSettings]
  );

  const { loading, fetchData } = useApi<CategoryResponseDetailsModel>();
  const { id } = useParams<{ id: string }>();

  const [localData, setLocalData] =
    useState<CategoryResponseDetailsModel | null>(null);

  const [activeLang, setActiveLang] = useState(defaultLang);
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
  const [, setNavigateTo] = useState("");

  useEffect(() => {
    const items = [
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.categories"), path: "/categories" },
    ];

    if (id && localData && localData?.translations[activeLang]?.slug)
      items.push({
        label: localData.translations[activeLang].slug,
        path: `/categories/${localData.id}`,
      });

    setBreadcrumb(items);
  }, [activeLang, id, localData, setBreadcrumb, t]);

  useEffect(() => {
    if (!defaultLang) return;

    if (id === "create") {
      const newCategory: CategoryResponseDetailsModel = {
        id: "",
        isActive: true,
        tags: [],
        translations: {
          [defaultLang]: {
            title: "",
            description: "",
            slug: "",
          },
        },
        createdBy: "",
        updatedBy: "",
        createdAt: "",
        updatedAt: "",
      };

      setLocalData(newCategory);
      setActiveLang(defaultLang);
      return;
    }

    if (id) {
      (async () => {
        const result = await fetchData(`categories/${id}`);
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

  const onAddLanguage = useCallback((lang: string) => {
    setLocalData((prev) => {
      if (!prev) return prev;
      if (prev.translations[lang]) {
        setActiveLang(lang);
        return prev;
      }
      const empty: CategoryTranslationModel = {
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

  const onChange = useCallback(
    (
      field: keyof CategoryTranslationModel | "tags" | "isActive",
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

      const body: CategoryUpsertModel = {
        id: id && id !== "create" ? localData.id : undefined,
        tags: localData.tags,
        isActive: localData.isActive,
        language: activeLang,
        ...localData.translations[activeLang],
      };

      const result = await fetchData("categories", "POST", body);

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
          navigate(`/categories/${result.data.id}`);
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
  return {
    data: localData,
    loading,
    activeLang,
    setActiveLang: onChangeActiveLang,
    onAddLanguage,
    hasChanges,
    handleNavigation,
    handleSave,
    onChange,
    showUnsavedAlert,
    formErrors,
  };
}
