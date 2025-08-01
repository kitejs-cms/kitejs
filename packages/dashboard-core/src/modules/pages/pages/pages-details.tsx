import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { JsonModal } from "../../../components/json-modal";
import { Button } from "../../../components/ui/button";
import { SettingsSection } from "../components/settings-section";
import { ContentSection } from "../components/content-section";
import { SeoSection } from "../components/seo-section";
import { LanguageTabs } from "../components/language-tabs";
import { UnsavedChangesDialog } from "../components/unsaved-changes-dialog";
import { usePageDetails } from "../hooks/use-page-details";
import { PageEditor } from "../components/page-editor";
import { SkeletonPage } from "../../../components/skeleton-page";
import { CustomFieldForm } from "../../../components/custom-field-form";

export type Props = {
  pageType?: "Post" | "Page";
};

export function PageDetailsPage({ pageType = "Page" }: Props) {
  const { t } = useTranslation("pages");
  const {
    data,
    loading,
    activeLang,
    setActiveLang,
    onAddLanguage,

    hasChanges,
    onContentChange,
    onSeoChange,
    onSettingsChange,
    customFields,
    customFieldsValues,
    onChangeCustomField,

    showUnsavedAlert,
    handleNavigation,
    closeUnsavedAlert,
    confirmDiscard,
    handleSave,
    formErrors,
  } = usePageDetails(pageType);

  const [searchParams] = useSearchParams();
  const [jsonView, setJsonView] = useState(false);
  const [editorView, setEditorView] = useState(false);

  useEffect(() => {
    if (searchParams.get("view") === "json") setJsonView(true);
    if (searchParams.get("view") === "editor") setEditorView(true);
  }, [searchParams]);

  if (loading || !data) return <SkeletonPage />;

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] p-4 md:p-6">
      <JsonModal
        isOpen={jsonView}
        onClose={() => setJsonView(false)}
        data={data}
      />

      <PageEditor
        activeLang={activeLang}
        isOpen={editorView}
        onClose={() => setEditorView(false)}
        onSave={handleSave}
        blocks={data?.translations[activeLang]?.blocks}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <LanguageTabs
          translations={data?.translations}
          activeLang={activeLang}
          onLanguageChange={setActiveLang}
          onAddLanguage={onAddLanguage}
        />

        <Button size="sm" onClick={() => setEditorView(true)}>
          {t("buttons.editVisual")}
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ContentSection
            formErrors={formErrors}
            activeLang={activeLang}
            translations={data?.translations}
            onChange={onContentChange}
            image={data.image}
            onChangeImage={
              pageType === "Page"
                ? undefined
                : (image) => {
                    onSettingsChange("image", image);
                  }
            }
          />
          <SeoSection
            activeLang={activeLang}
            translations={data?.translations}
            onChange={onSeoChange}
          />
        </div>

        <div className="space-y-6">
          <SettingsSection
            type={pageType}
            status={data?.status}
            publishAt={data?.publishAt}
            expireAt={data?.expireAt}
            tags={data?.tags}
            createdBy={data?.createdBy}
            updatedBy={data?.updatedBy}
            onChange={onSettingsChange}
            categories={data?.categories || []}
            onViewJson={() => setJsonView(true)}
          />

          {pageType === "Post" && (
            <CustomFieldForm
              title="Campi Personalizzati"
              fields={customFields}
              values={customFieldsValues}
              onChange={onChangeCustomField}
              errors={{}}
            />
          )}
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
