import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useApi,
  useBreadcrumb,
  useSettingsContext,
} from "@kitejs-cms/dashboard-core";
import {
  type GalleryResponseModel,
  type GalleryTranslationModel,
  type GalleryUpsertModel,
  type GalleryStatus,
  type GallerySettingsModel,
} from "@kitejs-cms/gallery-plugin";

type GalleryDetails = GalleryResponseModel;

export interface FormErrors {
  title?: string;
  slug?: string;
  [key: string]: string | undefined;
}

export function useGalleryDetails() {
  const { t } = useTranslation("gallery");
  const navigate = useNavigate();
  const { id } = useParams() as { id?: string };
  const { setBreadcrumb } = useBreadcrumb();
  const { cmsSettings } = useSettingsContext();
  const defaultLang = useMemo(
    () => cmsSettings?.defaultLanguage || "en",
    [cmsSettings],
  );

  const { loading, fetchData, uploadFile } = useApi<GalleryDetails>();

  const [data, setData] = useState<GalleryDetails | null>(null);
  const [activeLang, setActiveLang] = useState(defaultLang);
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
  const [navigateTo, setNavigateTo] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    const crumbs = [
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.galleries"), path: "/galleries" },
    ];
    if (id && id !== "create" && data) {
      const title = data.translations[activeLang]?.slug || id;
      crumbs.push({ label: title, path: `/galleries/${id}` });
    }
    setBreadcrumb(crumbs);
  }, [t, id, data, activeLang, setBreadcrumb]);

  useEffect(() => {
    if (!defaultLang) return;

    if (id === "create") {
      const empty: GalleryDetails = {
        id: "",
        status: "Draft" as GalleryStatus,
        tags: [],
        publishAt: new Date(),
        expireAt: null,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "",
        updatedBy: "",
        settings: {
          layout: "grid",
          columns: 3,
          gap: 0,
          ratio: "16:9",
          autoplay: false,
          loop: false,
          lightbox: true,
        },
        translations: {
          [defaultLang]: {
            title: "",
            description: "",
            slug: "",
            seo: {
              metaTitle: "",
              metaDescription: "",
              metaKeywords: [],
              canonical: "",
            },
          },
        },
      };
      setData(empty);
      setActiveLang(defaultLang);
      return;
    }

    if (id) {
      (async () => {
        const result = await fetchData(`galleries/${id}`);
        if (result?.data) {
          setData(result.data as unknown as GalleryDetails);
          setHasChanges(false);
        }
      })();
    }
  }, [id, fetchData, defaultLang]);

  useEffect(() => {
    if (!data) return;
    const langs = Object.keys(data.translations);
    const sorted = [...langs].sort((a, b) =>
      a === defaultLang ? -1 : b === defaultLang ? 1 : a.localeCompare(b),
    );
    if (!langs.includes(activeLang)) {
      setActiveLang(sorted[0]);
    }
  }, [data, defaultLang, activeLang]);

  const onContentChange = useCallback(
    (lang: string, field: keyof GalleryTranslationModel, value: string) => {
      setData((prev) => {
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
    [],
  );

  const onSeoChange = useCallback(
    (
      lang: string,
      field: keyof GalleryTranslationModel["seo"],
      value: string | string[],
    ) => {
      setData((prev) => {
        if (!prev) return prev;
        const translation = prev.translations[lang];
        return {
          ...prev,
          translations: {
            ...prev.translations,
            [lang]: {
              ...translation,
              seo: {
                ...translation.seo,
                [field]: value,
              },
            },
          },
        };
      });
      setHasChanges(true);
    },
    [],
  );

  const onSettingsChange = useCallback(
    (
      field: "status" | "publishAt" | "expireAt" | "tags",
      value: string | string[],
    ) => {
      setData((prev) => (prev ? { ...prev, [field]: value } : prev));
      setHasChanges(true);
    },
    [],
  );

  const onGallerySettingsChange = useCallback(
    (field: keyof GallerySettingsModel, value: string | number | boolean | null) => {
      setData((prev) =>
        prev ? { ...prev, settings: { ...prev.settings, [field]: value } } : prev,
      );
      setHasChanges(true);
    },
    [],
  );

  const onAddLanguage = useCallback((lang: string) => {
    setData((prev) => {
      if (!prev) return prev;
      if (prev.translations[lang]) return prev;
      return {
        ...prev,
        translations: {
          ...prev.translations,
          [lang]: {
            title: "",
            description: "",
            slug: "",
            seo: {
              metaTitle: "",
              metaDescription: "",
              metaKeywords: [],
              canonical: "",
            },
          },
        },
      };
    });
    setActiveLang(lang);
  }, []);

  const handleSave = useCallback(async () => {
    if (!data) return;
    const translation = data.translations[activeLang];

    const errors: FormErrors = {};
    if (!translation.title?.trim()) {
      errors.title = t("errors.titleRequired");
    }
    if (!translation.slug?.trim()) {
      errors.slug = t("errors.slugRequired");
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const body: GalleryUpsertModel = {
      id: data.id || undefined,
      slug: translation.slug,
      language: activeLang,
      status: data.status,
      tags: data.tags,
      publishAt: data.publishAt
        ? new Date(data.publishAt).toISOString()
        : undefined,
      expireAt: data.expireAt
        ? new Date(data.expireAt).toISOString()
        : undefined,
      title: translation.title,
      description: translation.description,
      items: data.items.map((it, idx) => ({
        id: it.id,
        assetId: it.assetId,
        order: idx,
        caption: it.caption,
        altOverride: it.altOverride,
        linkUrl: it.linkUrl,
        visibility: it.visibility,
      })),
      settings: data.settings,
      seo: translation.seo,
    };

    const result = await fetchData(
      "galleries",
      "POST",
      body as unknown as Record<string, unknown>,
    );
    if (result?.data) {
      setData(result.data as unknown as GalleryDetails);
      setHasChanges(false);
      setFormErrors({});
      if (id === "create") {
        navigate(`/galleries/${result.data.id}`);
      }
    }
  }, [data, activeLang, fetchData, id, navigate, t]);

  const handleNavigation = useCallback(
    (path: string) => {
      if (hasChanges) {
        setShowUnsavedAlert(true);
        setNavigateTo(path);
      } else {
        navigate(path);
      }
    },
    [hasChanges, navigate],
  );

  const closeUnsavedAlert = () => setShowUnsavedAlert(false);
  const confirmDiscard = () => {
    setShowUnsavedAlert(false);
    setHasChanges(false);
    navigate(navigateTo);
  };

  // Items management
  const uploadItem = useCallback(
    async (file: File) => {
      if (!data?.id) return;
      const form = new FormData();
      form.append("file", file);
      const { data: asset } = await uploadFile(
        `galleries/${data.id}/items/upload`,
        form,
      );
      const assetId = (asset as { assetId?: string })?.assetId;
      if (assetId) {
        const { data: updated } = await fetchData(
          `galleries/${data.id}/items`,
          "POST",
          { assetId },
        );
        if (updated) {
          setData((prev) =>
            prev ? { ...prev, items: (updated as GalleryDetails).items } : prev,
          );
        }
      }
    },
    [data, uploadFile, fetchData],
  );

  const sortItems = useCallback(
    async (ids: string[]) => {
      if (!data) return;
      const { data: updated } = await fetchData(
        `galleries/${data.id}/items/sort`,
        "POST",
        { itemIds: ids },
      );
      if (updated) {
        setData((prev) =>
          prev ? { ...prev, items: (updated as GalleryDetails).items } : prev,
        );
      }
    },
    [data, fetchData],
  );

  const removeItem = useCallback(
    async (id: string) => {
      if (!data) return;
      const { data: updated } = await fetchData(
        `galleries/${data.id}/items/${id}`,
        "DELETE",
      );
      if (updated) {
        setData((prev) =>
          prev ? { ...prev, items: (updated as GalleryDetails).items } : prev,
        );
      }
    },
    [data, fetchData],
  );

  return {
    data,
    loading,
    activeLang,
    setActiveLang,
    onContentChange,
    onSeoChange,
    onSettingsChange,
    onAddLanguage,
    uploadItem,
    sortItems,
    removeItem,
    handleSave,
    hasChanges,
    formErrors,
    showUnsavedAlert,
    handleNavigation,
    closeUnsavedAlert,
    confirmDiscard,
    onGallerySettingsChange,
  };
}
