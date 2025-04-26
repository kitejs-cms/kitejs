import { useState, useEffect } from "react";
import { Separator } from "../../../components/ui/separator";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Label } from "../../../components/ui/label";
import { Tabs, TabsContent } from "../../../components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";
import { PageTranslationModel } from "@kitejs-cms/core/index";

export interface ContentSectionProps {
  activeLang: string;
  translations: Record<string, PageTranslationModel>;
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
}: ContentSectionProps) {
  const { title, description, slug } = translations[activeLang] || {
    title: "",
    description: "",
    slug: "",
  };

  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    setSlugTouched(false);
  }, [activeLang]);

  const handleTitleChange = (value: string) => {
    onChange(activeLang, "title", value);

    if (!slugTouched) {
      const generated = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");

      if (generated && generated !== slug) {
        onChange(activeLang, "slug", generated);
      }
    }
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
        <CardTitle>Content</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="p-4 md:p-6">
        <Tabs value={activeLang}>
          <TabsContent value={activeLang} className="space-y-4">
            <div>
              <Label className="mb-2 block">Title</Label>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label className="mb-2 block">Slug</Label>
              <Input
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label className="mb-2 block">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                className="w-full min-h-[120px]"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
