import type { FieldDefinition } from "@kitejs-cms/core/index";
import { CustomFieldBuilder } from "../../../components/custom-field-builder";
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { useSettingsContext } from "../../../context/settings-context";

export function ArticleFieldsSettings() {
  const [pageFields, setPageFields] = useState<FieldDefinition[]>([]);
  const { getSetting, updateSetting, setHasUnsavedChanges, hasUnsavedChanges } =
    useSettingsContext();
  const { t } = useTranslation("core");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFields = async () => {
      try {
        const { value } = await getSetting<{
          value: { customFields: FieldDefinition[] };
        }>("core", "core:article");

        if (value?.customFields) {
          setPageFields(value.customFields);
        }
      } catch (error) {
        console.error("Failed to load article fields:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFields();
  }, [getSetting]);

  const handleFieldsChange = (newFields: FieldDefinition[]) => {
    setPageFields(newFields);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await updateSetting("core", "core:article", {
        customFields: pageFields,
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save article fields:", error);
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
      <CustomFieldBuilder value={pageFields} onChange={handleFieldsChange} />

      <div className="fixed bottom-4 right-4 p-4">
        <Button onClick={handleSave} disabled={!hasUnsavedChanges || isLoading}>
          {t("common.save", "Save")}
        </Button>
      </div>
    </div>
  );
}
