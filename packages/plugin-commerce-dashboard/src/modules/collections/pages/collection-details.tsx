import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  LanguageTabs,
  JsonModal,
  Label,
  Separator,
  SkeletonPage,
  Textarea,
} from "@kitejs-cms/dashboard-core";
import { useCollectionDetails } from "../hooks/use-collection-details";
import { SeoSection } from "../components/seo-section";
import { SettingsSection } from "../components/settings-section";
import { UnsavedChangesDialog } from "../components/unsaved-changes-dialog";

export function CommerceCollectionDetailsPage() {
  const [jsonView, setJsonView] = useState(false);
  const { t } = useTranslation("commerce");

  const {
    data,
    loading,
    activeLang,
    setActiveLang,
    onAddLanguage,
    hasChanges,
    handleNavigation,
    onSeoChange,
    handleSave,
    onChange,
    showUnsavedAlert,
    formErrors,
    confirmDiscard,
    closeUnsavedAlert,
    onSettingsChange,
  } = useCollectionDetails();

  if (loading || !data) return <SkeletonPage />;

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <div className="flex-1 p-4 md:p-6">
        <JsonModal
          isOpen={jsonView}
          onClose={() => setJsonView(false)}
          data={data}
        />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <LanguageTabs
            languages={Object.keys(data?.translations)}
            activeLanguage={activeLang}
            onLanguageChange={setActiveLang}
            onAddLanguage={onAddLanguage}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
          <div className="space-y-4 md:space-y-6 lg:col-span-2">
            <Card className="w-full gap-0 py-0 shadow-neutral-50">
              <CardHeader className="rounded-t-xl bg-secondary py-4 md:py-6 text-primary">
                <div className="flex items-center justify-between">
                  <CardTitle>{t("collections.sections.details")}</CardTitle>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-4 p-4 md:p-6">
                <div>
                  <Label className="mb-2 block" htmlFor="collection-title">
                    {t("collections.fields.title")}
                  </Label>
                  <Input
                    id="collection-title"
                    value={data.translations[activeLang]?.title || ""}
                    onChange={(event) => onChange("title", event.target.value)}
                  />
                </div>

                <div>
                  <Label className="mb-2 block" htmlFor="collection-slug">
                    {t("collections.fields.slug")}
                  </Label>
                  <Input
                    id="collection-slug"
                    value={data.translations[activeLang]?.slug || ""}
                    onChange={(event) => onChange("slug", event.target.value)}
                  />
                </div>

                <div>
                  <Label
                    className="mb-2 block"
                    htmlFor="collection-description"
                  >
                    {t("collections.fields.description")}
                  </Label>
                  <Textarea
                    id="collection-description"
                    value={data.translations[activeLang]?.description || ""}
                    onChange={(e) => onChange("description", e.target.value)}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            <SeoSection
              activeLang={activeLang}
              translations={data?.translations}
              onChange={onSeoChange}
            />
          </div>
          <div className="space-y-6">
            <SettingsSection
              status={data?.status}
              publishAt={data?.publishAt}
              expireAt={data?.expireAt}
              tags={data?.tags}
              createdBy={data?.createdBy}
              updatedBy={data?.updatedBy}
              onChange={onSettingsChange}
              parent={data?.parent}
              onViewJson={() => setJsonView(true)}
            />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-background border-t py-4 mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={() => handleNavigation("/pages")}>
          {t("buttons.cancel")}
        </Button>
        <Button onClick={() => handleSave()} disabled={!hasChanges}>
          {t("buttons.save")}
        </Button>
      </div>

      <UnsavedChangesDialog
        isOpen={showUnsavedAlert}
        onClose={closeUnsavedAlert}
        onDiscard={confirmDiscard}
      />
    </div>
  );
}
