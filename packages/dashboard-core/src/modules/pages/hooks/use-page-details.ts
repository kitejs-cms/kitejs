import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type {
  PageResponseDetailsModel,
  PageSeoModel,
  PageTranslationModel,
} from "@kitejs-cms/core/index";
import { useApi } from "../../../hooks/use-api";
import { useSettingsContext } from "../../../context/settings-context";

export function usePageDetails() {
  const { t } = useTranslation("pages");
  const navigate = useNavigate();
  const { cmsSettings } = useSettingsContext();
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

  // Fetch iniziale e reset dirty
  useEffect(() => {
    if (!id) return;
    (async () => {
      const result = await fetchData(`pages/${id}`);
      if (result?.data) {
        setLocalData(result.data);
        setHasChanges(false);
      }
    })();
  }, [id, fetchData]);

  // Sync activeLang
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

  // beforeunload warning
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

  // Content change
  function onContentChange(
    lang: string,
    field: keyof PageTranslationModel,
    value: string
  ) {
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
  }

  // SEO change
  function onSeoChange<K extends keyof PageSeoModel>(
    lang: string,
    field: K,
    value: PageSeoModel[K]
  ) {
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
  }

  // Settings change: status, publishAt, expireAt, tags
  function onSettingsChange(
    field: "status" | "publishAt" | "expireAt" | "tags",
    value: string | string[]
  ) {
    setLocalData((prev) => {
      if (!prev) return prev;
      if (field === "tags") {
        return { ...prev, tags: value as string[] };
      }
      return { ...prev, [field]: value as string };
    });
    setHasChanges(true);
  }

  // Navigation
  function handleNavigation(path: string) {
    if (hasChanges) {
      setNavigateTo(path);
      setShowUnsavedAlert(true);
    } else {
      navigate(path);
    }
  }
  function closeUnsavedAlert() {
    setShowUnsavedAlert(false);
  }
  function confirmDiscard() {
    setShowUnsavedAlert(false);
    setHasChanges(false);
    if (localData) {
      setLocalData((prev) => (prev ? { ...prev } : prev));
    }
    navigate(navigateTo);
  }

  // Save
  function handleSave() {
    if (!localData) return;
    // TODO: call save API
    console.log(localData);
  }

  // Language
  function onAddLanguage(lang: string) {
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
  }

  return {
    data: localData,
    loading,
    activeLang,
    setActiveLang,
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
  };
}
