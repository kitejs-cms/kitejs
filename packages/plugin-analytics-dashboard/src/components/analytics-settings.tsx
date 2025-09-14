import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Skeleton,
  Switch,
  useSettingsContext,
} from "@kitejs-cms/dashboard-core";
import type { AnalyticsPluginSettingsModel } from "@kitejs-cms/plugin-analytics-api";
import {
  ANALYTICS_PLUGIN_NAMESPACE,
  ANALYTICS_SETTINGS_KEY,
} from "../module";

export function AnalyticsSettings() {
  const { t } = useTranslation("analytics");
  const { t: tCore } = useTranslation("core");
  const {
    getSetting,
    updateSetting,
    hasUnsavedChanges,
    setHasUnsavedChanges,
  } = useSettingsContext();

  const [settings, setSettings] =
    useState<AnalyticsPluginSettingsModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await getSetting<{ value: AnalyticsPluginSettingsModel }>(
          ANALYTICS_PLUGIN_NAMESPACE,
          ANALYTICS_SETTINGS_KEY,
        );
        if (res?.value) {
          setSettings(res.value);
        }
      } catch (err) {
        console.error("Failed to load analytics settings", err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [getSetting]);

  const handleRetentionChange = (val: string) => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            retentionDays:
              val.trim() === "" ? null : Number.parseInt(val, 10) || 0,
          }
        : prev,
    );
    setHasUnsavedChanges(true);
  };

  const toggleRetention = (checked: boolean) => {
    setSettings((prev) =>
      prev ? { ...prev, retentionDays: checked ? null : 0 } : prev,
    );
    setHasUnsavedChanges(true);
  };

  const regenerateApiKey = () => {
    setSettings((prev) =>
      prev ? { ...prev, apiKey: crypto.randomUUID() } : prev,
    );
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!settings) return;
    setLoading(true);
    try {
      await updateSetting(
        ANALYTICS_PLUGIN_NAMESPACE,
        ANALYTICS_SETTINGS_KEY,
        settings,
      );
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error("Failed to save analytics settings", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-24 ml-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="space-y-2">
        <Label htmlFor="apiKey">{t("settings.general.apiKey")}</Label>
        <div className="flex gap-2">
          <Input
            id="apiKey"
            type={showApiKey ? "text" : "password"}
            value={settings?.apiKey ?? ""}
            readOnly
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowApiKey((s) => !s)}
            size="icon"
          >
            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button type="button" variant="outline" onClick={regenerateApiKey}>
            {t("settings.general.regenerate")}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="retentionDays">
          {t("settings.general.retentionDays")}
        </Label>
        <Input
          id="retentionDays"
          type="number"
          value={settings?.retentionDays ?? ""}
          onChange={(e) => handleRetentionChange(e.target.value)}
          disabled={settings?.retentionDays === null}
        />
        <div className="flex items-center gap-2">
          <Switch
            id="noRetention"
            checked={settings?.retentionDays === null}
            onCheckedChange={toggleRetention}
          />
          <Label htmlFor="noRetention">
            {t("settings.general.noRetention")}
          </Label>
        </div>
      </div>

      <div className="fixed bottom-4 right-4 p-4">
        <Button onClick={handleSave} disabled={!hasUnsavedChanges || loading}>
          {tCore("common.save")}
        </Button>
      </div>
    </div>
  );
}

