import type { FieldDefinition } from "@kitejs-cms/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Skeleton, useSettingsContext } from "@kitejs-cms/dashboard-core";
import { CustomFieldBuilder } from "@kitejs-cms/dashboard-core/components/custom-field-builder";
import { type GalleryPluginSettingsModel } from "../../../plugin-gallery-api";

export const GALLERY_PLUGIN_NAMESPACE = "gallery-plugin";
export const GALLERY_SETTINGS_KEY = `${GALLERY_PLUGIN_NAMESPACE}:gallery`;

export function GalleryFieldsSettings() {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const { getSetting, updateSetting, setHasUnsavedChanges, hasUnsavedChanges } =
    useSettingsContext();
  const { t } = useTranslation("core");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFields = async () => {
      try {
        const { value } = await getSetting<{
          value: GalleryPluginSettingsModel;
        }>(GALLERY_PLUGIN_NAMESPACE, GALLERY_SETTINGS_KEY);
        if (value?.customFields) {
          setFields(value.customFields);
        }
      } catch (error) {
        console.error("Failed to load gallery fields:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadFields();
  }, [getSetting]);

  const handleChange = (newFields: FieldDefinition[]) => {
    setFields(newFields);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await updateSetting(GALLERY_PLUGIN_NAMESPACE, GALLERY_SETTINGS_KEY, {
        customFields: fields,
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save gallery fields:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-10 w-24 ml-auto" />
      </div>
    );
  }

  return (
    <div className="pb-16">
      <CustomFieldBuilder value={fields} onChange={handleChange} />
      <div className="fixed bottom-4 right-4 p-4">
        <Button onClick={handleSave} disabled={!hasUnsavedChanges || isLoading}>
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
}
