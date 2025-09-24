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
import {
  CollectionSeoModel,
  CollectionTranslationModel,
} from "@kitejs-cms/plugin-commerce-api";
import { useTranslation } from "react-i18next";

interface SeoSectionProps {
  activeLang: string;
  translations: Record<string, CollectionTranslationModel>;
  onChange: (
    lang: string,
    field: keyof CollectionSeoModel,
    value: string | string[]
  ) => void;
}

export function SeoSection({
  activeLang,
  translations,
  onChange,
}: SeoSectionProps) {
  const { t } = useTranslation("commerce");
  const seo = translations[activeLang]?.seo || {
    metaTitle: "",
    metaDescription: "",
    metaKeywords: [],
    canonical: "",
  };

  const handleMetaTitleChange = (value: string) => {
    onChange(activeLang, "metaTitle", value);
  };

  const handleMetaDescriptionChange = (value: string) => {
    onChange(activeLang, "metaDescription", value);
  };

  const handleCanonicalChange = (value: string) => {
    onChange(activeLang, "canonical", value);
  };

  const handleKeywordsChange = (value: string[]) => {
    onChange(activeLang, "metaKeywords", value);
  };

  return (
    <Card className="w-full shadow-neutral-50 gap-0 py-0">
      <CardHeader className="bg-secondary text-primary rounded-t-xl py-6">
        <CardTitle>{t("collections.sections.seo")}</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="p-4 md:p-6">
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">{t("collections.seo.metaTitle")}</Label>
            <Input
              value={seo.metaTitle}
              onChange={(e) => handleMetaTitleChange(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Label className="mb-2 block">{t("collections.seo.metaDescription")}</Label>
            <Textarea
              value={seo.metaDescription}
              onChange={(e) => handleMetaDescriptionChange(e.target.value)}
              className="w-full min-h-[100px]"
            />
          </div>
          <div>
            <Label className="mb-2 block">{t("collections.seo.metaKeywords")}</Label>
            <TagsInput
              initialTags={seo.metaKeywords}
              onChange={handleKeywordsChange}
            />
          </div>
          <div>
            <Label className="mb-2 block">{t("collections.seo.canonical")}</Label>
            <Input
              value={seo.canonical}
              onChange={(e) => handleCanonicalChange(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
