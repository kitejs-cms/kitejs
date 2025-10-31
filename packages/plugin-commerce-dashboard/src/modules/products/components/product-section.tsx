import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  HTMLEditor,
  Input,
  Label,
  MultiSelect,
  Separator,
  useApi,
} from "@kitejs-cms/dashboard-core";
import type {
  CollectionResponseDetailsModel,
  ProductTranslationModel,
} from "@kitejs-cms/plugin-commerce-api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ProductMediaModal } from "./product-media-modal";
import type { MediaSource } from "../hooks/use-product-media";

interface ProductSectionProps {
  activeLang: string;
  translations: Record<string, ProductTranslationModel>;
  collections?: string[];
  gallery?: MediaSource[];
  thumbnail?: string | null;
  thumbnailError?: string;
  onChange: (
    field: keyof ProductTranslationModel,
    value: string | string[]
  ) => void;
  onCollectionsChange: (value: string[]) => void;
  onMediaChange: (
    payload: { gallery: string[]; thumbnail: string | null },
    options?: { force?: boolean }
  ) => Promise<void>;
}

export function ProductSection({
  activeLang,
  translations,
  collections,
  gallery,
  thumbnail,
  thumbnailError,
  onChange,
  onCollectionsChange,
  onMediaChange,
}: ProductSectionProps) {
  const { t, i18n } = useTranslation("commerce");
  const { data, fetchData } = useApi<CollectionResponseDetailsModel[]>();
  const [collectionOptions, setCollectionOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  useEffect(() => {
    if (data) {
      const local = i18n.language.split("-")[0];
      setCollectionOptions(
        data.map((collection) => ({
          value: collection.id,
          label: collection.translations?.[local]?.title || collection.id,
        }))
      );
    }
  }, [data, i18n.language]);

  useEffect(() => {
    fetchData("commerce/collections?page[number]=1&page[size]=100");
  }, [fetchData]);

  const galleryCount = useMemo(() => gallery?.length ?? 0, [gallery]);

  const handleAutoPersistMedia = useCallback(
    (payload: { gallery: string[]; thumbnail: string | null }) =>
      onMediaChange(payload),
    [onMediaChange]
  );

  const handleConfirmMedia = useCallback(
    async ({
      gallery: nextGallery,
      thumbnail: nextThumbnail,
    }: {
      gallery: string[];
      thumbnail: string | null;
    }) => {
      try {
        await onMediaChange(
          { gallery: nextGallery, thumbnail: nextThumbnail },
          { force: true }
        );
        setIsMediaModalOpen(false);
      } catch (error) {
        console.error("Unable to persist product media", error);
      }
    },
    [onMediaChange]
  );

  return (
    <Card className="w-full shadow-neutral-50 gap-0 py-0">
      <CardHeader className="bg-secondary text-primary rounded-t-xl py-6">
        <CardTitle>{t("products.sections.details")}</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="p-4 md:p-6">
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block" htmlFor="product-title">
              {t("products.fields.title")}
            </Label>
            <Input
              id="product-title"
              value={translations[activeLang]?.title || ""}
              onChange={(event) => onChange("title", event.target.value)}
            />
          </div>

          <div>
            <Label className="mb-2 block" htmlFor="product-slug">
              {t("products.fields.slug")}
            </Label>
            <Input
              id="product-slug"
              value={translations[activeLang]?.slug || ""}
              onChange={(event) => onChange("slug", event.target.value)}
            />
          </div>

          <div>
            <Label className="mb-2 block" htmlFor="product-summary">
              {t("products.fields.summary")}
            </Label>
            <Input
              id="product-summary"
              value={translations[activeLang]?.summary || ""}
              onChange={(event) => onChange("summary", event.target.value)}
            />
          </div>

          <div>
            <Label className="mb-2 block" htmlFor="product-description">
              {t("products.fields.description")}
            </Label>
            <HTMLEditor
              enabledFeatures={{
                bold: true,
                italic: true,
                underline: true,
                link: true,
                align: true,
              }}
              mode="classic"
              content={translations[activeLang]?.description || ""}
              onChange={(e) => onChange("description", e)}
            />
          </div>
        </div>
        {/* Collection padre (sotto-collection) — opzionale */}
        <div className="pt-4">
          <Label className="mb-2 block">
            {t("products.fields.collections")}
          </Label>

          <MultiSelect
            initialTags={collections ?? []}
            options={collectionOptions}
            onChange={onCollectionsChange}
          />
        </div>

        <div className="pt-6">
          <Label className="mb-2 block">{t("products.fields.thumbnail")}</Label>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start pt-2">
            <div className="flex aspect-square w-full max-w-xs items-center justify-center overflow-hidden rounded-md border bg-muted sm:w-48">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={t("products.details.media.previewAlt")}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="py-12 text-sm text-muted-foreground">
                  {t("products.details.media.empty")}
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-2">
              <p className="max-w-sm text-sm text-muted-foreground">
                {t("products.details.media.description")}
              </p>
              {galleryCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("products.details.media.count", { count: galleryCount })}
                </p>
              )}
              {thumbnailError && (
                <p className="text-sm text-destructive">{thumbnailError}</p>
              )}
              <Button
                className="w-fit"
                onClick={() => setIsMediaModalOpen(true)}
              >
                {t("products.details.media.button")}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      <ProductMediaModal
        open={isMediaModalOpen}
        onOpenChange={setIsMediaModalOpen}
        gallery={gallery ?? []}
        thumbnail={thumbnail}
        language={activeLang}
        onConfirm={handleConfirmMedia}
        onPersist={handleAutoPersistMedia}
      />
    </Card>
  );
}
