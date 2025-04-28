import { Separator } from "../../../components/ui/separator";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Label } from "../../../components/ui/label";
import { TagsInput } from "../../../components/tag-input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";
import type {
  PageSeoModel,
  PageTranslationModel,
} from "@kitejs-cms/core/index";
import { useTranslation } from "react-i18next";

interface SeoSectionProps {
  activeLang: string;
  translations: Record<string, PageTranslationModel>;
  onChange: (
    lang: string,
    field: keyof PageSeoModel,
    value: string | string[]
  ) => void;
}

export function SeoSection({
  activeLang,
  translations,
  onChange,
}: SeoSectionProps) {
  const { t } = useTranslation("pages");
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
        <CardTitle>{t("sections.seo")}</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="p-4 md:p-6">
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">{t("seo.metaTitle")}</Label>
            <Input
              value={seo.metaTitle}
              onChange={(e) => handleMetaTitleChange(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Label className="mb-2 block">{t("seo.metaDescription")}</Label>
            <Textarea
              value={seo.metaDescription}
              onChange={(e) => handleMetaDescriptionChange(e.target.value)}
              className="w-full min-h-[100px]"
            />
          </div>
          <div>
            <Label className="mb-2 block">{t("seo.metaKeywords")}</Label>
            <TagsInput
              initialTags={seo.metaKeywords}
              onChange={handleKeywordsChange}
            />
          </div>
          <div>
            <Label className="mb-2 block">{t("seo.canonical")}</Label>
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
