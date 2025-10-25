import {
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
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface ProductSectionProps {
  activeLang: string;
  translations: Record<string, ProductTranslationModel>;
  collections?: string[];
  onChange: (
    field: keyof ProductTranslationModel,
    value: string | string[]
  ) => void;
  onCollectionsChange: (value: string[]) => void;
}

export function ProductSection({
  activeLang,
  translations,
  collections,
  onChange,
  onCollectionsChange,
}: ProductSectionProps) {
  const { t, i18n } = useTranslation("commerce");
  const { data, fetchData } = useApi<CollectionResponseDetailsModel[]>();
  const [collectionOptions, setCollectionOptions] = useState<
    { value: string; label: string }[]
  >([]);

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
      </CardContent>
    </Card>
  );
}
