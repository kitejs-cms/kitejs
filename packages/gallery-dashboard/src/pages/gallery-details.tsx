import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, SkeletonPage } from "@kitejs-cms/dashboard-core";
import { JsonModal } from "@kitejs-cms/dashboard-core/components/json-modal";
import { LanguageTabs } from "../components/language-tabs";
import { ContentSection } from "../components/content-section";
import { SeoSection } from "../components/seo-section";
import { SettingsSection } from "../components/settings-section";
import { UnsavedChangesDialog } from "../components/unsaved-changes-dialog";
import { GalleryItemsSection } from "../components/items-section";
import { GalleryEditorModal } from "../components/gallery-editor-modal";
import { useGalleryDetails } from "../hooks/use-gallery-details";
import type { GalleryTranslationModel } from "@kitejs-cms/gallery-plugin";

type SettingsChangeHandler = (
  field: "status" | "publishAt" | "expireAt" | "tags",
  value: string | string[],
) => void;

export function GalleryDetailsPage() {
  const { t } = useTranslation("gallery");
  const [searchParams] = useSearchParams();
  const [jsonView, setJsonView] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [gridSettings, setGridSettings] = useState({
    layout: "grid",
    columns: "3",
    gap: "0",
    ratio: "16:9",
  });
  const {
    data,
    loading,
    activeLang,
    setActiveLang,
    onContentChange,
    onSeoChange,
    onSettingsChange,
    onAddLanguage,
    uploadItem,
    sortItems,
    removeItem,
    handleSave,
    hasChanges,
    formErrors,
    showUnsavedAlert,
    handleNavigation,
    closeUnsavedAlert,
    confirmDiscard,
  } = useGalleryDetails();

  useEffect(() => {
    if (searchParams.get("view") === "json") setJsonView(true);
  }, [searchParams]);

  if (loading || !data) return <SkeletonPage />;

  const translations = data.translations as Record<
    string,
    GalleryTranslationModel
  >;

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] p-4 md:p-6">
      <JsonModal
        isOpen={jsonView}
        onClose={() => setJsonView(false)}
        data={data}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <LanguageTabs
          translations={translations}
          activeLang={activeLang}
          onLanguageChange={setActiveLang}
          onAddLanguage={onAddLanguage}
        />
        <Button onClick={() => setEditorOpen(true)}>
          {t("buttons.editGallery")}
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ContentSection
            activeLang={activeLang}
            translations={translations}
            onChange={onContentChange}
            formErrors={formErrors}
          />
          <SeoSection
            activeLang={activeLang}
            translations={translations}
            onChange={onSeoChange}
          />
          <GalleryItemsSection
            items={data.items}
            onUpload={uploadItem}
            onSort={sortItems}
          />
        </div>
        <div className="space-y-6">
          <SettingsSection
            status={data.status}
            publishAt={
              data.publishAt instanceof Date
                ? data.publishAt.toISOString()
                : data.publishAt || ""
            }
            expireAt={
              data.expireAt instanceof Date
                ? data.expireAt.toISOString()
                : data.expireAt || ""
            }
            tags={data.tags}
            createdBy={data.createdBy}
            updatedBy={data.updatedBy}
            onChange={onSettingsChange as SettingsChangeHandler}
            onViewJson={() => setJsonView(true)}
          />
        </div>
      </div>

      <div className="sticky bottom-0 bg-background border-t py-4 mt-6 flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => handleNavigation("/galleries")}
        >
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
      <GalleryEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        items={data.items}
        onUpload={uploadItem}
        onSort={sortItems}
        onDelete={removeItem}
        gridSettings={gridSettings}
        onGridChange={(field, value) =>
          setGridSettings((prev) => ({ ...prev, [field]: value }))
        }
      />
    </div>
  );
}
