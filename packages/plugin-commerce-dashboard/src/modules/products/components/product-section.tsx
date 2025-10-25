import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FileUploader,
  HTMLEditor,
  Input,
  Label,
  MultiSelect,
  Separator,
  useApi,
} from "@kitejs-cms/dashboard-core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kitejs-cms/dashboard-core/components/ui/dialog";
import type {
  CollectionResponseDetailsModel,
  ProductTranslationModel,
} from "@kitejs-cms/plugin-commerce-api";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface ProductSectionProps {
  activeLang: string;
  translations: Record<string, ProductTranslationModel>;
  collections?: string[];
  thumbnail?: string;
  thumbnailError?: string;
  onChange: (
    field: keyof ProductTranslationModel,
    value: string | string[]
  ) => void;
  onCollectionsChange: (value: string[]) => void;
  onThumbnailChange: (value: string) => void;
}

export function ProductSection({
  activeLang,
  translations,
  collections,
  thumbnail,
  thumbnailError,
  onChange,
  onCollectionsChange,
  onThumbnailChange,
}: ProductSectionProps) {
  const { t, i18n } = useTranslation("commerce");
  const { data, fetchData } = useApi<CollectionResponseDetailsModel[]>();
  const [collectionOptions, setCollectionOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [temporaryThumbnail, setTemporaryThumbnail] = useState<string | null>(
    null
  );

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

  useEffect(() => {
    if (isMediaModalOpen) {
      setTemporaryThumbnail(thumbnail ?? null);
    }
  }, [isMediaModalOpen, thumbnail]);

  const handleConfirmThumbnail = () => {
    if (!temporaryThumbnail) return;
    onThumbnailChange(temporaryThumbnail);
    setIsMediaModalOpen(false);
  };

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

        <div className="pt-4">
          <Label className="mb-2 block">
            {t("products.fields.thumbnail")}
          </Label>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-48 w-full max-w-xs items-center justify-center overflow-hidden rounded-md border bg-muted sm:w-48">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={t("products.details.media.previewAlt")}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm text-muted-foreground">
                  {t("products.details.media.empty")}
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-2">
              <Button
                variant="outline"
                className="w-fit"
                onClick={() => setIsMediaModalOpen(true)}
              >
                {t("products.details.media.button")}
              </Button>
              <p className="text-sm text-muted-foreground max-w-sm">
                {t("products.details.media.description")}
              </p>
              {thumbnailError && (
                <p className="text-sm text-destructive">{thumbnailError}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <Dialog open={isMediaModalOpen} onOpenChange={setIsMediaModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-hidden p-0" position="right">
          <div className="flex h-full flex-col">
            <DialogHeader className="gap-1 border-b px-6 py-4">
              <DialogTitle>{t("products.details.media.modalTitle")}</DialogTitle>
              <DialogDescription>
                {t("products.details.media.modalDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <FileUploader
                acceptedTypes="image/*"
                onChange={(url) => setTemporaryThumbnail(url)}
                defaultUrl={temporaryThumbnail}
                dirName="commerce/products"
              />
            </div>

            <DialogFooter className="border-t px-6 py-4">
              <Button
                variant="outline"
                onClick={() => setIsMediaModalOpen(false)}
              >
                {t("products.buttons.cancel")}
              </Button>
              <Button onClick={handleConfirmThumbnail} disabled={!temporaryThumbnail}>
                {t("products.details.media.confirm")}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
