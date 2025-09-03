import { EMPTY_GALLERY, DEFAULT_SETTINGS } from "../constant/empty-gallery";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UploadResultModel } from "@kitejs-cms/core";
import {
  useApi,
  useBreadcrumb,
  useSettingsContext,
} from "@kitejs-cms/dashboard-core";
import {
  type GalleryResponseModel,
  type GalleryTranslationModel,
  type GalleryUpsertModel,
  type GallerySettingsModel,
} from "../../../plugin-gallery-api/dist";

type GalleryDetails = GalleryResponseModel;

export interface FormErrors {
  title?: string;
  slug?: string;
  [key: string]: string | undefined;
}

function mergeSettings(
  partial?: Partial<GallerySettingsModel>
): GallerySettingsModel {
  return {
    ...DEFAULT_SETTINGS,
    ...partial,
    responsive: {
      ...DEFAULT_SETTINGS.responsive,
      ...partial?.responsive,
      desktop: {
        ...DEFAULT_SETTINGS.responsive.desktop,
        ...partial?.responsive?.desktop,
      },
      tablet: {
        ...DEFAULT_SETTINGS.responsive.tablet,
        ...partial?.responsive?.tablet,
      },
      mobile: {
        ...DEFAULT_SETTINGS.responsive.mobile,
        ...partial?.responsive?.mobile,
      },
    },
    manual: {
      ...DEFAULT_SETTINGS.manual,
      ...partial?.manual,
    },
  };
}

export function useGalleryDetails() {
  const { t } = useTranslation("gallery");
  const navigate = useNavigate();
  const { id } = useParams() as { id?: string };
  const { setBreadcrumb } = useBreadcrumb();
  const { cmsSettings } = useSettingsContext();

  const defaultLang = useMemo(
    () => cmsSettings?.defaultLanguage || "en",
    [cmsSettings]
  );

  const { loading, fetchData, uploadFile } = useApi<UploadResultModel>();

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
      const empty: GalleryDetails = EMPTY_GALLERY(defaultLang);
      empty.settings = mergeSettings(empty.settings);
      setData(empty);
      setActiveLang(defaultLang);
      return;
    }

    if (id) {
      (async () => {
        const result = await fetchData(`galleries/${id}`);
        if (result?.data) {
          const loaded = result.data as unknown as GalleryDetails;
          loaded.settings = mergeSettings(loaded.settings);
          setData(loaded);
          setHasChanges(false);
        }
      })();
    }
  }, [id, fetchData, defaultLang]);

  useEffect(() => {
    if (!data) return;
    const langs = Object.keys(data.translations);
    if (!langs.length) return;
    if (!langs.includes(activeLang)) {
      const next = langs.includes(defaultLang) ? defaultLang : langs.sort()[0];
      setActiveLang(next);
    }
  }, [data, defaultLang, activeLang]);

  const onContentChange = useCallback(
    (lang: string, field: keyof GalleryTranslationModel, value: string) => {
      setData((prev) =>
        prev
          ? {
              ...prev,
              translations: {
                ...prev.translations,
                [lang]: { ...prev.translations[lang], [field]: value },
              },
            }
          : prev
      );
      setHasChanges(true);
    },
    []
  );

  const onSeoChange = useCallback(
    (
      lang: string,
      field: keyof GalleryTranslationModel["seo"],
      value: string | string[]
    ) => {
      setData((prev) => {
        if (!prev) return prev;
        const tr = prev.translations[lang];
        return {
          ...prev,
          translations: {
            ...prev.translations,
            [lang]: { ...tr, seo: { ...tr.seo, [field]: value } },
          },
        };
      });
      setHasChanges(true);
    },
    []
  );

  const onSettingsChange = useCallback(
    (
      field: "status" | "publishAt" | "expireAt" | "tags",
      value: string | string[]
    ) => {
      setData((prev) => (prev ? { ...prev, [field]: value } : prev));
      setHasChanges(true);
    },
    []
  );

  const onGallerySettingsChange = useCallback((next: GallerySettingsModel) => {
    setData((prev) =>
      prev ? { ...prev, settings: mergeSettings(next) } : prev
    );
    setHasChanges(true);
  }, []);

  const onAddLanguage = useCallback((lang: string) => {
    setData((prev) => {
      if (!prev || prev.translations[lang]) return prev;
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
    if (!translation.title?.trim()) errors.title = t("errors.titleRequired");
    if (!translation.slug?.trim()) errors.slug = t("errors.slugRequired");
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
      body as unknown as Record<string, unknown>
    );
    if (result?.data) {
      const updated = result.data as unknown as GalleryDetails;
      updated.settings = mergeSettings(updated.settings);
      setData(updated);
      setHasChanges(false);
      setFormErrors({});
      if (id === "create") navigate(`/galleries/${updated.id}`);
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
    [hasChanges, navigate]
  );

  const closeUnsavedAlert = () => setShowUnsavedAlert(false);
  const confirmDiscard = () => {
    setShowUnsavedAlert(false);
    setHasChanges(false);
    navigate(navigateTo);
  };

  const uploadItem = async (file: File) => {
    if (!data?.id) return;
    const form = new FormData();
    form.append("file", file);
    form.append("dir", `galleries/${data.id}`);
    const { data: asset } = await uploadFile(
      `galleries/${data.id}/items/upload`,
      form
    );
    if (asset) {
      const { data: updated } = await fetchData(
        `galleries/${data.id}/items`,
        "POST",
        { assetId: asset.assetId, linkUrl: asset.url }
      );
      if (updated) {
        setData((prev) =>
          prev
            ? { ...prev, items: (updated as unknown as GalleryDetails).items }
            : prev
        );
      }
    }
  };

  const sortItems = useCallback(
    async (ids: string[]) => {
      if (!data) return;
      const { data: updated } = await fetchData(
        `galleries/${data.id}/items/sort`,
        "POST",
        { itemIds: ids }
      );
      if (updated) {
        setData((prev) =>
          prev
            ? { ...prev, items: (updated as unknown as GalleryDetails).items }
            : prev
        );
      }
    },
    [data, fetchData]
  );

  const removeItem = useCallback(
    async (id: string) => {
      if (!data) return;
      const { data: updated } = await fetchData(
        `galleries/${data.id}/items/${id}`,
        "DELETE"
      );
      if (updated) {
        setData((prev) =>
          prev
            ? { ...prev, items: (updated as unknown as GalleryDetails).items }
            : prev
        );
      }
    },
    [data, fetchData]
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
