import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { JsonModal } from "../../../components/json-modal";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { TagsInput } from "../../../components/tag-input";
import { Button } from "../../../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { useCategoryDetails } from "../hooks/use-category-details";
import { LanguageTabs } from "../components/language-tabs";
import { SkeletonPage } from "../../../components/skeleton-page";
import { Separator } from "../../../components/ui/separator";
import { FileJson } from "lucide-react";
import { Switch } from "../../../components/ui/switch";
import { Textarea } from "../../../components/ui/textarea";

export function CategoryDetailsPage() {
  const { t } = useTranslation("posts");
  const {
    data,
    activeLang,
    hasChanges,
    loading,
    setActiveLang,
    onAddLanguage,
    handleNavigation,
    handleSave,
    onChange
  } = useCategoryDetails();

  const [searchParams] = useSearchParams();
  const [jsonView, setJsonView] = useState(false);

  useEffect(() => {
    if (searchParams.get("view") === "json")
      setJsonView(true);
  }, [searchParams]);

  if (loading || !data) return <SkeletonPage />;

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <div className="flex-1 p-4 md:p-6">
        <JsonModal
          isOpen={jsonView}
          onClose={() => setJsonView(false)}
          data={data}
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <LanguageTabs
            translations={data?.translations}
            activeLang={activeLang}
            onLanguageChange={setActiveLang}
            onAddLanguage={onAddLanguage}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <Card className="w-full shadow-neutral-50 gap-0 py-0">
              <CardHeader className="bg-secondary text-primary py-4 md:py-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <CardTitle>{t("sections.details")}</CardTitle>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-4 md:p-6 space-y-4">
                <div>
                  <Label className="mb-2 block">{t("fields.title")}</Label>
                  <Input
                    value={data.translations[activeLang]?.title || ""}
                    onChange={(e) => onChange("title", e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">{t("fields.slug")}</Label>
                  <Input
                    value={data.translations[activeLang]?.slug || ""}
                    onChange={(e) => onChange("slug", e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">{t("fields.description")}</Label>
                  <Textarea
                    value={data.translations[activeLang]?.description || ""}
                    onChange={(e) => onChange("description", e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">{t("fields.tags")}</Label>
                  <TagsInput
                    initialTags={data.tags || []}
                    onChange={(newTags) => onChange("tags", newTags)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="w-full shadow-neutral-50 gap-0 py-0">
              <CardHeader className="bg-secondary text-primary py-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <CardTitle>{t("sections.settings")}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setJsonView(true)}
                    className="flex items-center"
                    aria-label={t("buttons.viewJson")}
                  >
                    <FileJson className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-4 md:p-6 space-y-4">
                <div className="flex flex-row items-center justify-between rounded-lg border p-2 md:p-4">
                  <div className="space-y-0.5">
                    <span className="text-base">{t("fields.isActive")}</span>
                  </div>
                  <Switch
                    checked={data.isActive}
                    onCheckedChange={(checked) => onChange("isActive", checked)}
                  />
                </div>

                <div>
                  <Label className="mb-2 block">{t("fields.createdBy")}</Label>
                  <Input
                    value={data.createdBy || ""}
                    disabled
                    className="w-full cursor-not-allowed"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">{t("fields.updatedBy")}</Label>
                  <Input
                    value={data.updatedBy || ""}
                    disabled
                    className="w-full cursor-not-allowed"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-background border-t py-4 px-4 md:px-6">
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => handleNavigation("/categories")}
          >
            {t("buttons.cancel")}
          </Button>
          <Button onClick={() => handleSave()} disabled={!hasChanges}>
            {t("buttons.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}