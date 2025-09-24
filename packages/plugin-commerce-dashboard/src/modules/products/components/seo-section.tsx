import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardTitle,
  Separator,
  CardContent,
  Label,
  Input,
  Textarea,
  TagsInput,
} from "@kitejs-cms/dashboard-core";
import type { ProductSeoModel } from "@kitejs-cms/plugin-commerce-api";
import type { ProductTranslationModel } from "../hooks/use-product-details";

interface ProductSeoSectionProps {
  activeLang: string;
  translations: Record<string, ProductTranslationModel>;
  onChange: <K extends keyof ProductSeoModel>(
    lang: string,
    field: K,
    value: ProductSeoModel[K]
  ) => void;
}

export function ProductSeoSection({
  activeLang,
  translations,
  onChange,
}: ProductSeoSectionProps) {
  const { t } = useTranslation("commerce");

  const seo = translations[activeLang]?.seo ?? {
    metaTitle: "",
    metaDescription: "",
    metaKeywords: [],
    canonicalUrl: "",
  };

  return (
    <Card className="w-full gap-0 py-0 shadow-neutral-50">
      <CardHeader className="rounded-t-xl bg-secondary py-4 md:py-6 text-primary">
        <CardTitle>{t("products.sections.seo")}</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-4 p-4 md:p-6">
        <div>
          <Label className="mb-2 block" htmlFor="product-meta-title">
            {t("products.seo.metaTitle")}
          </Label>
          <Input
            id="product-meta-title"
            value={seo.metaTitle ?? ""}
            onChange={(event) =>
              onChange(activeLang, "metaTitle", event.target.value)
            }
          />
        </div>

        <div>
          <Label className="mb-2 block" htmlFor="product-meta-description">
            {t("products.seo.metaDescription")}
          </Label>
          <Textarea
            id="product-meta-description"
            value={seo.metaDescription ?? ""}
            onChange={(event) =>
              onChange(activeLang, "metaDescription", event.target.value)
            }
            className="min-h-[100px]"
          />
        </div>

        <div>
          <Label className="mb-2 block" htmlFor="product-meta-keywords">
            {t("products.seo.metaKeywords")}
          </Label>
          <TagsInput
            id="product-meta-keywords"
            initialTags={seo.metaKeywords ?? []}
            onChange={(value) => onChange(activeLang, "metaKeywords", value)}
          />
        </div>

        <div>
          <Label className="mb-2 block" htmlFor="product-canonical-url">
            {t("products.seo.canonicalUrl")}
          </Label>
          <Input
            id="product-canonical-url"
            value={seo.canonicalUrl ?? ""}
            onChange={(event) =>
              onChange(activeLang, "canonicalUrl", event.target.value)
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
