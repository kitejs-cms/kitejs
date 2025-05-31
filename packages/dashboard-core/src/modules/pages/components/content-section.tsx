import { useState, useEffect } from "react";
import { Separator } from "../../../components/ui/separator";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Label } from "../../../components/ui/label";
import { Tabs, TabsContent } from "../../../components/ui/tabs";
import type { PageTranslationModel } from "@kitejs-cms/core/index";
import { useTranslation } from "react-i18next";
import { FormErrors } from "../hooks/use-page-details";
import { FileUploader } from "../../../components/file-uploader";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";

export interface ContentSectionProps {
  activeLang: string;
  translations: Record<string, PageTranslationModel>;
  formErrors: FormErrors;
  image?: string | null;
  onChangeImage?: (url: string) => void;
  onChange: (
    lang: string,
    field: keyof PageTranslationModel,
    value: string
  ) => void;
}

export function ContentSection({
  activeLang,
  translations,
  onChange,
  image,
  onChangeImage,
  formErrors,
}: ContentSectionProps) {
  const { t } = useTranslation("pages");
  const { title, description, slug } = translations[activeLang] || {
    title: "",
    description: "",
    slug: "",
  };

  const [slugTouched, setSlugTouched] = useState(false);
  const [localErrors, setLocalErrors] = useState<FormErrors>({});

  useEffect(() => {
    setSlugTouched(false);
  }, [activeLang]);

  useEffect(() => {
    const relevantErrors = Object.entries(formErrors).reduce(
      (acc, [key, value]) => {
        if (
          ["title", "description", "slug", "content", "image"].includes(key)
        ) {
          acc[key] = value;
        }
        return acc;
      },
      {} as FormErrors
    );

    setLocalErrors(relevantErrors);
  }, [formErrors]);

  const handleTitleChange = (value: string) => {
    onChange(activeLang, "title", value);

    if (!slugTouched) {
      const generated = generateSlug(value);
      if (generated && generated !== slug) {
        onChange(activeLang, "slug", generated);
      }
    }
  };

  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    onChange(activeLang, "slug", value);
  };

  const handleDescriptionChange = (value: string) => {
    onChange(activeLang, "description", value);
  };

  return (
    <Card className="w-full shadow-neutral-50 gap-0 py-0">
      <CardHeader className="bg-secondary text-primary py-6 rounded-t-xl">
        <CardTitle>{t("sections.content")}</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="p-4 md:p-6">
        <Tabs value={activeLang}>
          <TabsContent value={activeLang} className="space-y-4">
            {/* Title Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>{t("fields.title")}</Label>
                {localErrors.title && (
                  <span className="text-sm text-destructive">
                    {localErrors.title}
                  </span>
                )}
              </div>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full"
                aria-invalid={!!localErrors.title}
              />
            </div>

            {/* Slug Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>{t("fields.slug")}</Label>
                {localErrors.slug && (
                  <span className="text-sm text-destructive">
                    {localErrors.slug}
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="w-full"
                  aria-invalid={!!localErrors.slug}
                />
              </div>
            </div>

            {/* Description Field */}
            <div>
              <Label className="mb-2 block">{t("fields.description")}</Label>
              <Textarea
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                className="w-full min-h-[120px]"
                aria-invalid={!!localErrors.description}
              />
              {localErrors.description && (
                <p className="mt-1 text-sm text-destructive">
                  {localErrors.description}
                </p>
              )}
            </div>

            {/* Image Upload Field */}
            {onChangeImage && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>{t("fields.image")}</Label>
                  {localErrors.image && (
                    <span className="text-sm text-destructive">
                      {localErrors.image}
                    </span>
                  )}
                </div>
                <FileUploader
                  acceptedTypes="image/*"
                  onChange={onChangeImage}
                  defaultUrl={image || null}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
