import type { FieldDefinition } from "@kitejs-cms/core/index";
import { CustomFieldBuilder } from "@kitejs-cms/dashboard-core/components/custom-field-builder";
import { useEffect, useState } from "react";
import { Button } from "@kitejs-cms/dashboard-core/components/ui/button";
import { useTranslation } from "react-i18next";
import { useSettingsContext } from "@kitejs-cms/dashboard-core/context/settings-context";

export function GallerySettings() {
  const [galleryFields, setGalleryFields] = useState<FieldDefinition[]>([]);
  const { getSetting, updateSetting, setHasUnsavedChanges, hasUnsavedChanges } =
    useSettingsContext();
  const { t } = useTranslation("core");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFields = async () => {
      try {
        const { value } = await getSetting<{
          value: { customFields: FieldDefinition[] };
        }>("core", "core:gallery");

        if (value?.customFields) {
          setGalleryFields(value.customFields);
        }
      } catch (error) {
        console.error("Failed to load gallery fields:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFields();
  }, [getSetting]);

  const handleFieldsChange = (newFields: FieldDefinition[]) => {
    setGalleryFields(newFields);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await updateSetting("core", "core:gallery", {
        customFields: galleryFields,
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save gallery fields:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>{t("common.loading", "Loading...")}</div>;
  }

  return (
    <div className="pb-16">
      <CustomFieldBuilder value={galleryFields} onChange={handleFieldsChange} />

      <div className="fixed bottom-4 right-4 p-4">
        <Button onClick={handleSave} disabled={!hasUnsavedChanges || isLoading}>
          {t("common.save", "Save")}
        </Button>
      </div>
    </div>
  );
}
