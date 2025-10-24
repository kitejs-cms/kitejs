import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useProductDetails } from "../hooks/use-product-details";
import {
  Button,
  JsonModal,
  LanguageTabs,
  SkeletonPage,
} from "@kitejs-cms/dashboard-core";
import { SeoSection } from "../components/seo-section";
import { UnsavedChangesDialog } from "../../collections/components/unsaved-changes-dialog";
import { SettingsSection } from "../components/settings-section";
import { ProductSection } from "../components/product-section";

export function CommerceProductDetailsPage() {
  const { t } = useTranslation("commerce");
  const {
    data,
    loading,
    activeLang,
    showUnsavedAlert,
    handleNavigation,
    hasChanges,
    confirmDiscard,
    closeUnsavedAlert,
    handleSave,
    setActiveLang,
    onAddLanguage,
    onSeoChange,
    onSettingsChange,
    onChange,
  } = useProductDetails();
  const [jsonView, setJsonView] = useState(false);

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
            languages={Object.keys(data.translations)}
            activeLanguage={activeLang}
            onLanguageChange={setActiveLang}
            onAddLanguage={onAddLanguage}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
          <div className="space-y-4 md:space-y-6 lg:col-span-2">
            {/* Main Product */}
            <ProductSection
              activeLang={activeLang}
              translations={data.translations}
              onChange={onChange}
            />

            {/* Varaint Product */}

            {/* SEO Section */}
            <SeoSection
              activeLang={activeLang}
              translations={data?.translations}
              onChange={onSeoChange}
            />
          </div>
          <div className="space-y-6">
            <SettingsSection
              status={data?.status}
              publishAt={data?.publishAt as unknown as string}
              tags={data?.tags}
              createdBy={data?.createdBy}
              updatedBy={data?.updatedBy}
              onChange={onSettingsChange}
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
