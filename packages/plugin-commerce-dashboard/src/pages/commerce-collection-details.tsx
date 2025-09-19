import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  JsonModal,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  SkeletonPage,
  TagsInput,
  Textarea,
  useApi,
  useBreadcrumb,
  useSettingsContext,
} from "@kitejs-cms/dashboard-core";
import { FileJson, Save } from "lucide-react";
import { CollectionLanguageTabs } from "../components/collection-language-tabs";

interface CollectionSeo {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
}

interface CollectionTranslation {
  title?: string;
  description?: string;
  slug?: string;
  seo?: CollectionSeo;
}

type CollectionStatus = "Draft" | "Published" | "Archived";

interface CollectionDetail {
  id: string;
  status?: CollectionStatus;
  tags?: string[];
  publishAt?: string | null;
  expireAt?: string | null;
  coverImage?: string | null;
  translations: Record<string, CollectionTranslation>;
  slugs: Record<string, string>;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

function generateSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toDateInputValue(value?: string | Date | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function toIsoString(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function createEmptySeo(): CollectionSeo {
  return {
    metaTitle: "",
    metaDescription: "",
    metaKeywords: [],
    canonicalUrl: "",
  };
}

function createEmptyTranslation(): CollectionTranslation {
  return {
    title: "",
    slug: "",
    description: "",
    seo: createEmptySeo(),
  };
}

export function CommerceCollectionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation("commerce");
  const { setBreadcrumb } = useBreadcrumb();
  const { cmsSettings } = useSettingsContext();

  const {
    data: fetchedCollection,
    loading: loadingCollection,
    fetchData: fetchCollection,
  } = useApi<CollectionDetail>();
  const { loading: savingCollection, fetchData: upsertCollection } =
    useApi<CollectionDetail>();

  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [translations, setTranslations] = useState<Record<string, CollectionTranslation>>({});
  const [activeLanguage, setActiveLanguage] = useState<string>(
    cmsSettings?.defaultLanguage ?? "en"
  );
  const [status, setStatus] = useState<CollectionStatus>("Draft");
  const [publishAt, setPublishAt] = useState<string>("");
  const [expireAt, setExpireAt] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [jsonView, setJsonView] = useState(false);
  const [dirty, setDirty] = useState(false);

  const isCreating = !id || location.pathname.endsWith("/new");

  useEffect(() => {
    if (searchParams.get("view") === "json") setJsonView(true);
  }, [searchParams]);

  const languages = useMemo(() => Object.keys(translations), [translations]);

  const currentTranslation = translations[activeLanguage] ?? createEmptyTranslation();
  const currentSeo = currentTranslation.seo ?? createEmptySeo();

  const resolveTitle = useMemo(() => {
    const fallbackTitle = t("collections.details.breadcrumb");
    const translation =
      translations[activeLanguage]?.title?.trim() ||
      translations[i18n.language]?.title?.trim() ||
      translations[cmsSettings?.defaultLanguage ?? ""]?.title?.trim();
    return translation || fallbackTitle;
  }, [
    translations,
    activeLanguage,
    i18n.language,
    cmsSettings?.defaultLanguage,
    t,
  ]);

  useEffect(() => {
    setBreadcrumb([
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.collections"), path: "/commerce/collections" },
      isCreating
        ? { label: t("collections.create.breadcrumb"), path: location.pathname }
        : { label: resolveTitle, path: location.pathname },
    ]);
  }, [setBreadcrumb, t, location.pathname, isCreating, resolveTitle]);

  useEffect(() => {
    if (!isCreating && id) {
      void fetchCollection(`commerce/collections/${id}`);
    }
  }, [fetchCollection, id, isCreating]);

  useEffect(() => {
    if (fetchedCollection) {
      const data = fetchedCollection;
      setCollection(data);
      setStatus((data.status as CollectionStatus) ?? "Draft");
      setTags(data.tags ?? []);
      setPublishAt(toDateInputValue(data.publishAt));
      setExpireAt(toDateInputValue(data.expireAt));

      const normalized: Record<string, CollectionTranslation> = {};
      const translationEntries = Object.entries(
        data.translations ?? {}
      ) as Array<[string, CollectionTranslation]>;
      translationEntries.forEach(([language, value]) => {
        const seo = value?.seo ?? {};
        const keywords = Array.isArray(seo?.metaKeywords)
          ? seo.metaKeywords.filter((keyword): keyword is string => Boolean(keyword))
          : [];
        normalized[language] = {
          title: value?.title ?? "",
          description: value?.description ?? "",
          slug: value?.slug ?? data.slugs?.[language] ?? "",
          seo: {
            metaTitle: seo?.metaTitle ?? "",
            metaDescription: seo?.metaDescription ?? "",
            metaKeywords: keywords,
            canonicalUrl: seo?.canonicalUrl ?? "",
          },
        };
      });
      setTranslations(normalized);

      const preferredLanguage = normalized[i18n.language]
        ? i18n.language
        : cmsSettings?.defaultLanguage && normalized[cmsSettings.defaultLanguage]
          ? cmsSettings.defaultLanguage
          : Object.keys(normalized)[0] ?? cmsSettings?.defaultLanguage ?? "en";
      setActiveLanguage(preferredLanguage);
      setDirty(false);
    }
  }, [fetchedCollection, cmsSettings?.defaultLanguage, i18n.language]);

  useEffect(() => {
    if (isCreating && languages.length === 0) {
      const defaultLanguage = cmsSettings?.defaultLanguage ?? "en";
      setTranslations({
        [defaultLanguage]: createEmptyTranslation(),
      });
      setActiveLanguage(defaultLanguage);
      setStatus("Draft");
      setTags([]);
      setPublishAt("");
      setExpireAt("");
      setDirty(false);
    }
  }, [isCreating, cmsSettings?.defaultLanguage, languages.length]);

  const handleAddLanguage = (language: string) => {
    setTranslations((prev) => ({
      ...prev,
      [language]: createEmptyTranslation(),
    }));
    setActiveLanguage(language);
    setDirty(true);
  };

  const handleTitleChange = (value: string) => {
    setTranslations((prev) => {
      const current = prev[activeLanguage] ?? createEmptyTranslation();
      const nextSlug = current.slug?.trim() ? current.slug : generateSlug(value);
      return {
        ...prev,
        [activeLanguage]: {
          ...current,
          title: value,
          slug: nextSlug,
        },
      };
    });
    setDirty(true);
  };

  const handleTranslationChange = <
    K extends "title" | "slug" | "description"
  >(
    field: K,
    value: CollectionTranslation[K]
  ) => {
    setTranslations((prev) => {
      const current = prev[activeLanguage] ?? createEmptyTranslation();
      const nextValue =
        typeof value === "string" ? (value as CollectionTranslation[K]) : ("" as CollectionTranslation[K]);
      return {
        ...prev,
        [activeLanguage]: {
          ...current,
          [field]: nextValue,
        },
      };
    });
    setDirty(true);
  };

  const handleSeoChange = <K extends keyof CollectionSeo>(
    field: K,
    value: CollectionSeo[K]
  ) => {
    setTranslations((prev) => {
      const current = prev[activeLanguage] ?? createEmptyTranslation();
      const currentSeo = current.seo ?? createEmptySeo();
      let nextValue: CollectionSeo[K];
      if (Array.isArray(value)) {
        nextValue = [...value] as CollectionSeo[K];
      } else if (typeof value === "string") {
        nextValue = value as CollectionSeo[K];
      } else {
        nextValue = (field === "metaKeywords"
          ? ([] as unknown as CollectionSeo[K])
          : ("" as CollectionSeo[K]));
      }

      return {
        ...prev,
        [activeLanguage]: {
          ...current,
          seo: {
            ...currentSeo,
            [field]: nextValue,
          },
        },
      };
    });
    setDirty(true);
  };

  const handleTagsChange = (updated: string[]) => {
    setTags(updated);
    setDirty(true);
  };

  const handleSave = async () => {
    const translation = translations[activeLanguage];
    if (!translation || !translation.title?.trim() || !translation.slug?.trim()) {
      return;
    }

    const seo = translation.seo ?? createEmptySeo();
    const sanitizedKeywords = (seo.metaKeywords ?? [])
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 0);

    const payload = {
      id: collection?.id,
      language: activeLanguage,
      title: translation.title.trim(),
      slug: translation.slug.trim(),
      description: translation.description?.trim() ?? undefined,
      status,
      tags,
      publishAt: toIsoString(publishAt),
      expireAt: toIsoString(expireAt),
      seo: {
        metaTitle: seo.metaTitle?.trim() || undefined,
        metaDescription: seo.metaDescription?.trim() || undefined,
        metaKeywords: sanitizedKeywords.length > 0 ? sanitizedKeywords : undefined,
        canonicalUrl: seo.canonicalUrl?.trim() || undefined,
      },
    };

    const { data: savedCollection, error: saveError } = await upsertCollection(
      "commerce/collections",
      "POST",
      payload
    );

    if (saveError || !savedCollection) {
      return;
    }

    setCollection(savedCollection);
    setStatus((savedCollection.status as CollectionStatus) ?? status);
    setTags(savedCollection.tags ?? []);
    setPublishAt(toDateInputValue(savedCollection.publishAt));
    setExpireAt(toDateInputValue(savedCollection.expireAt));

    const normalized: Record<string, CollectionTranslation> = {};
    const savedEntries = Object.entries(
      savedCollection.translations ?? {}
    ) as Array<[string, CollectionTranslation]>;
    savedEntries.forEach(([language, value]) => {
      const seoValue = value?.seo ?? {};
      const keywords = Array.isArray(seoValue?.metaKeywords)
        ? seoValue.metaKeywords.filter((keyword): keyword is string => Boolean(keyword))
        : [];
      normalized[language] = {
        title: value?.title ?? "",
        description: value?.description ?? "",
        slug: value?.slug ?? savedCollection.slugs?.[language] ?? "",
        seo: {
          metaTitle: seoValue?.metaTitle ?? "",
          metaDescription: seoValue?.metaDescription ?? "",
          metaKeywords: keywords,
          canonicalUrl: seoValue?.canonicalUrl ?? "",
        },
      };
    });
    setTranslations(normalized);

    const preferredLanguage = normalized[activeLanguage]
      ? activeLanguage
      : cmsSettings?.defaultLanguage && normalized[cmsSettings.defaultLanguage]
        ? cmsSettings.defaultLanguage
        : Object.keys(normalized)[0] ?? activeLanguage;
    setActiveLanguage(preferredLanguage);
    setDirty(false);

    if (!collection && savedCollection.id) {
      navigate(`/commerce/collections/${savedCollection.id}`, { replace: true });
    }
  };

  const formatDateTime = (value?: string | Date | null) => {
    if (!value) return "-";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    try {
      return new Intl.DateTimeFormat(i18n.language, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    } catch {
      return date.toISOString();
    }
  };

  const ready = languages.length > 0;

  if ((loadingCollection && !collection && !isCreating) || !ready) {
    return <SkeletonPage />;
  }

  const jsonData = collection ?? {
    status,
    tags,
    publishAt,
    expireAt,
    translations,
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <div className="flex-1 p-4 md:p-6">
        <JsonModal isOpen={jsonView} onClose={() => setJsonView(false)} data={jsonData} />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CollectionLanguageTabs
            languages={languages}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            onAddLanguage={handleAddLanguage}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
          <div className="space-y-4 md:space-y-6 lg:col-span-2">
            <Card className="w-full gap-0 py-0 shadow-neutral-50">
              <CardHeader className="rounded-t-xl bg-secondary py-4 md:py-6 text-primary">
                <div className="flex items-center justify-between">
                  <CardTitle>{t("collections.sections.details")}</CardTitle>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-4 p-4 md:p-6">
                <div>
                  <Label className="mb-2 block" htmlFor="collection-title">
                    {t("collections.fields.title")}
                  </Label>
                  <Input
                    id="collection-title"
                    value={currentTranslation.title ?? ""}
                    onChange={(event) => handleTitleChange(event.target.value)}
                  />
                </div>

                <div>
                  <Label className="mb-2 block" htmlFor="collection-slug">
                    {t("collections.fields.slug")}
                  </Label>
                  <Input
                    id="collection-slug"
                    value={currentTranslation.slug ?? ""}
                    onChange={(event) =>
                      handleTranslationChange("slug", event.target.value)
                    }
                  />
                </div>

                <div>
                  <Label className="mb-2 block" htmlFor="collection-description">
                    {t("collections.fields.description")}
                  </Label>
                  <Textarea
                    id="collection-description"
                    value={currentTranslation.description ?? ""}
                    onChange={(event) =>
                      handleTranslationChange("description", event.target.value)
                    }
                    rows={5}
                  />
                </div>

                <div>
                  <Label className="mb-2 block">{t("collections.fields.tags")}</Label>
                  <TagsInput
                    key={tags.join(",")}
                    initialTags={tags}
                    onChange={handleTagsChange}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="w-full gap-0 py-0 shadow-neutral-50">
              <CardHeader className="rounded-t-xl bg-secondary py-4 md:py-6 text-primary">
                <CardTitle>{t("collections.sections.seo")}</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-4 p-4 md:p-6">
                <div>
                  <Label className="mb-2 block" htmlFor="collection-seo-title">
                    {t("collections.seo.metaTitle")}
                  </Label>
                  <Input
                    id="collection-seo-title"
                    value={currentSeo.metaTitle ?? ""}
                    onChange={(event) =>
                      handleSeoChange("metaTitle", event.target.value)
                    }
                  />
                </div>

                <div>
                  <Label className="mb-2 block" htmlFor="collection-seo-description">
                    {t("collections.seo.metaDescription")}
                  </Label>
                  <Textarea
                    id="collection-seo-description"
                    value={currentSeo.metaDescription ?? ""}
                    onChange={(event) =>
                      handleSeoChange("metaDescription", event.target.value)
                    }
                    rows={4}
                  />
                </div>

                <div>
                  <Label className="mb-2 block">{t("collections.seo.metaKeywords")}</Label>
                  <TagsInput
                    key={(currentSeo.metaKeywords ?? []).join(",")}
                    initialTags={currentSeo.metaKeywords ?? []}
                    onChange={(updated) => handleSeoChange("metaKeywords", updated)}
                  />
                </div>

                <div>
                  <Label className="mb-2 block" htmlFor="collection-seo-canonical">
                    {t("collections.seo.canonicalUrl")}
                  </Label>
                  <Input
                    id="collection-seo-canonical"
                    value={currentSeo.canonicalUrl ?? ""}
                    onChange={(event) =>
                      handleSeoChange("canonicalUrl", event.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 md:space-y-6">
            <Card className="w-full gap-0 py-0 shadow-neutral-50">
              <CardHeader className="rounded-t-xl bg-secondary py-4 text-primary">
                <div className="flex items-center justify-between">
                  <CardTitle>{t("collections.sections.settings")}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setJsonView(true)}
                    className="flex items-center"
                    aria-label={t("collections.buttons.viewJson")}
                  >
                    <FileJson className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-4 p-4 md:p-6">
                <div>
                  <Label className="mb-2 block">{t("collections.fields.status")}</Label>
                  <Select value={status} onValueChange={(value) => {
                    setStatus(value as CollectionStatus);
                    setDirty(true);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">
                        {t("collections.status.Draft", { defaultValue: "Draft" })}
                      </SelectItem>
                      <SelectItem value="Published">
                        {t("collections.status.Published", { defaultValue: "Published" })}
                      </SelectItem>
                      <SelectItem value="Archived">
                        {t("collections.status.Archived", { defaultValue: "Archived" })}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block" htmlFor="collection-publishAt">
                    {t("collections.fields.publishAt")}
                  </Label>
                  <Input
                    id="collection-publishAt"
                    type="datetime-local"
                    value={publishAt}
                    onChange={(event) => {
                      setPublishAt(event.target.value);
                      setDirty(true);
                    }}
                  />
                </div>

                <div>
                  <Label className="mb-2 block" htmlFor="collection-expireAt">
                    {t("collections.fields.expireAt")}
                  </Label>
                  <Input
                    id="collection-expireAt"
                    type="datetime-local"
                    value={expireAt}
                    onChange={(event) => {
                      setExpireAt(event.target.value);
                      setDirty(true);
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {collection && (
              <Card className="w-full gap-0 py-0 shadow-neutral-50">
                <CardHeader className="rounded-t-xl bg-secondary py-4 text-primary">
                  <CardTitle>{t("collections.sections.meta")}</CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="space-y-4 p-4 md:p-6 text-sm">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      {t("collections.meta.created")}
                    </p>
                    <p>{formatDateTime(collection.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      {t("collections.meta.updated")}
                    </p>
                    <p>{formatDateTime(collection.updatedAt)}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 border-t bg-background py-4 px-4 md:px-6">
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/commerce/collections")}>
            {t("collections.buttons.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={savingCollection || !dirty}>
            <Save className="mr-2 h-4 w-4" />
            {t("collections.buttons.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
