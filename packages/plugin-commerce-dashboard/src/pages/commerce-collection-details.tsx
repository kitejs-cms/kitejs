import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Textarea,
  useApi,
  useBreadcrumb,
  useSettingsContext,
} from "@kitejs-cms/dashboard-core";
import { Plus, Save, X } from "lucide-react";
import { CollectionLanguageTabs } from "../components/collection-language-tabs";

interface CollectionTranslation {
  title?: string;
  description?: string;
  slug?: string;
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

export function CommerceCollectionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
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
  const [activeLanguage, setActiveLanguage] = useState<string>(cmsSettings?.defaultLanguage ?? "en");
  const [status, setStatus] = useState<CollectionStatus>("Draft");
  const [publishAt, setPublishAt] = useState<string>("");
  const [expireAt, setExpireAt] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isCreating = !id || location.pathname.endsWith("/new");

  const availableLanguages = useMemo(() => Object.keys(translations), [translations]);

  const currentTranslation = useMemo(() => {
    if (!activeLanguage) return { title: "", slug: "", description: "" };
    return (
      translations[activeLanguage] ?? {
        title: "",
        slug: "",
        description: "",
      }
    );
  }, [translations, activeLanguage]);

  const resolveTitle = useCallback(() => {
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
        : { label: resolveTitle(), path: location.pathname },
    ]);
  }, [
    setBreadcrumb,
    t,
    location.pathname,
    isCreating,
    resolveTitle,
  ]);

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
      Object.entries(data.translations ?? {}).forEach(([language, value]) => {
        normalized[language] = {
          title: value?.title ?? "",
          description: value?.description ?? "",
          slug:
            value?.slug ?? data.slugs?.[language] ?? "",
        };
      });
      setTranslations(normalized);

      const preferredLanguage = normalized[i18n.language]
        ? i18n.language
        : cmsSettings?.defaultLanguage && normalized[cmsSettings.defaultLanguage]
          ? cmsSettings.defaultLanguage
          : Object.keys(normalized)[0] ?? cmsSettings?.defaultLanguage ?? "en";
      setActiveLanguage(preferredLanguage);
    }
  }, [fetchedCollection, cmsSettings?.defaultLanguage, i18n.language]);

  useEffect(() => {
    if (isCreating && Object.keys(translations).length === 0) {
      const defaultLanguage = cmsSettings?.defaultLanguage ?? "en";
      setTranslations({
        [defaultLanguage]: { title: "", slug: "", description: "" },
      });
      setActiveLanguage(defaultLanguage);
      setStatus("Draft");
      setTags([]);
      setPublishAt("");
      setExpireAt("");
    }
  }, [isCreating, cmsSettings?.defaultLanguage, translations]);

  const handleAddLanguage = (language: string) => {
    setTranslations((prev) => ({
      ...prev,
      [language]: { title: "", slug: "", description: "" },
    }));
    setActiveLanguage(language);
  };

  const handleTitleChange = (value: string) => {
    setTranslations((prev) => {
      const current = prev[activeLanguage] ?? { title: "", slug: "", description: "" };
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
  };

  const handleTranslationChange = <K extends keyof CollectionTranslation>(
    field: K,
    value: CollectionTranslation[K]
  ) => {
    setTranslations((prev) => ({
      ...prev,
      [activeLanguage]: {
        ...(prev[activeLanguage] ?? { title: "", slug: "", description: "" }),
        [field]: value ?? "",
      },
    }));
  };

  const handleAddTag = () => {
    const next = tagInput.trim();
    if (!next) return;
    if (tags.includes(next)) {
      setTagInput("");
      return;
    }
    setTags((prev) => [...prev, next]);
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((value) => value !== tag));
  };

  const handleSave = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const translation = translations[activeLanguage];
    if (!translation || !translation.title?.trim() || !translation.slug?.trim()) {
      setErrorMessage(t("collections.details.notifications.validationError"));
      return;
    }

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
    };

    const { data: savedCollection, error: saveError } = await upsertCollection(
      "commerce/collections",
      "POST",
      payload
    );

    if (saveError || !savedCollection) {
      setErrorMessage(t("collections.details.notifications.error"));
      return;
    }

    setCollection(savedCollection);
    setStatus((savedCollection.status as CollectionStatus) ?? status);
    setTags(savedCollection.tags ?? []);
    setPublishAt(toDateInputValue(savedCollection.publishAt));
    setExpireAt(toDateInputValue(savedCollection.expireAt));

    const normalized: Record<string, CollectionTranslation> = {};
    Object.entries(savedCollection.translations ?? {}).forEach(([language, value]) => {
      normalized[language] = {
        title: value?.title ?? "",
        description: value?.description ?? "",
        slug:
          value?.slug ?? savedCollection.slugs?.[language] ?? "",
      };
    });
    setTranslations(normalized);

    const preferredLanguage = normalized[activeLanguage]
      ? activeLanguage
      : cmsSettings?.defaultLanguage && normalized[cmsSettings.defaultLanguage]
        ? cmsSettings.defaultLanguage
        : Object.keys(normalized)[0] ?? activeLanguage;
    setActiveLanguage(preferredLanguage);

    const message = collection
      ? t("collections.details.notifications.saved")
      : t("collections.details.notifications.created");
    setSuccessMessage(message);

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
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return date.toISOString();
    }
  };

  if (loadingCollection && !collection && !isCreating) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const languagesForTabs = availableLanguages.length > 0 ? availableLanguages : [activeLanguage];

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="px-0">
        {t("common.back")}
      </Button>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>
            {isCreating
              ? t("collections.create.title")
              : t("collections.details.title")}
          </CardTitle>
          <CardDescription>
            {isCreating
              ? t("collections.create.description")
              : t("collections.details.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {successMessage ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}
          {errorMessage ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <section className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Label className="text-sm font-medium text-muted-foreground">
                {t("collections.details.language")}
              </Label>
              <CollectionLanguageTabs
                languages={languagesForTabs}
                activeLanguage={activeLanguage}
                onLanguageChange={setActiveLanguage}
                onAddLanguage={handleAddLanguage}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="collection-title">{t("collections.details.name")}</Label>
                <Input
                  id="collection-title"
                  value={currentTranslation.title ?? ""}
                  onChange={(event) => handleTitleChange(event.target.value)}
                  placeholder={t("collections.details.namePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collection-slug">{t("collections.details.slug")}</Label>
                <Input
                  id="collection-slug"
                  value={currentTranslation.slug ?? ""}
                  onChange={(event) =>
                    handleTranslationChange("slug", event.target.value)
                  }
                  placeholder={t("collections.details.slugPlaceholder")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="collection-description">
                {t("collections.details.description")}
              </Label>
              <Textarea
                id="collection-description"
                value={currentTranslation.description ?? ""}
                onChange={(event) =>
                  handleTranslationChange("description", event.target.value)
                }
                placeholder={t("collections.details.descriptionPlaceholder")}
                rows={5}
              />
            </div>
          </section>

          <Separator />

          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("collections.details.status")}</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as CollectionStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("collections.details.status") ?? undefined} />
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
            <div className="space-y-2">
              <Label>{t("collections.details.tags")}</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder={t("collections.details.tagPlaceholder")}
                />
                <Button type="button" variant="secondary" onClick={handleAddTag} disabled={!tagInput.trim()}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t("collections.details.addTag")}
                </Button>
              </div>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="flex items-center gap-1 font-normal">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="rounded-full focus:outline-none"
                        aria-label={t("collections.details.removeTag", { tag })}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("collections.details.noTags")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="collection-publishAt">
                {t("collections.details.publishAt")}
              </Label>
              <Input
                id="collection-publishAt"
                type="datetime-local"
                value={publishAt}
                onChange={(event) => setPublishAt(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collection-expireAt">
                {t("collections.details.expireAt")}
              </Label>
              <Input
                id="collection-expireAt"
                type="datetime-local"
                value={expireAt}
                onChange={(event) => setExpireAt(event.target.value)}
              />
            </div>
          </section>

          {collection ? (
            <section className="rounded-md border bg-muted/30 p-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("collections.details.meta.title")}
              </h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">
                    {t("collections.details.meta.created")}
                  </p>
                  <p className="text-sm font-medium">
                    {formatDateTime(collection.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">
                    {t("collections.details.meta.updated")}
                  </p>
                  <p className="text-sm font-medium">
                    {formatDateTime(collection.updatedAt)}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/commerce/collections")}
            >
              {t("collections.details.actions.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={savingCollection}
            >
              <Save className="mr-2 h-4 w-4" />
              {t("collections.details.actions.save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
