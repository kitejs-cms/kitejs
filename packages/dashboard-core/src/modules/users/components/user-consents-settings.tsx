import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettingsContext } from "../../../context/settings-context";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Switch } from "../../../components/ui/switch";
import { Label } from "../../../components/ui/label";
import { Trash2 } from "lucide-react";
import { UserSettingsModel } from "@kitejs-cms/core/modules/settings/models/user-settings.model";
import { Skeleton } from "../../../components/ui/skeleton";

export function UserConsentSettings() {
  const { t } = useTranslation("users");
  const {
    getSetting,
    updateSetting,
    setHasUnsavedChanges,
    hasUnsavedChanges,
  } = useSettingsContext();

  type Consent = UserSettingsModel["consents"][number];

  const [consentsEnabled, setConsentsEnabled] = useState(false);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [slugEdited, setSlugEdited] = useState<boolean[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const slugify = (str: string) =>
    str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-");

  useEffect(() => {
    (async () => {
      const setting = await getSetting<{ value: UserSettingsModel }>(
        "core",
        "core:users"
      );
      if (setting?.value) {
        setConsentsEnabled(setting.value.consentsEnabled ?? false);
        const loadedConsents = setting.value.consents || [];
        setConsents(loadedConsents);
        setSlugEdited(
          loadedConsents.map((c) =>
            c.slug ? c.slug !== slugify(c.name) : false
          )
        );
      }
      setIsLoading(false);
    })();
  }, [getSetting]);

  const handleConsentChange = (
    index: number,
    field: keyof Consent,
    value: unknown
  ) => {
    setConsents((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value } as Consent;
      return next;
    });
    setHasUnsavedChanges(true);
  };

  const addConsent = () => {
    setConsents((prev) => [
      ...prev,
      { name: "", slug: "", description: "", required: false },
    ]);
    setSlugEdited((prev) => [...prev, false]);
    setHasUnsavedChanges(true);
  };

  const removeConsent = (index: number) => {
    setConsents((prev) => prev.filter((_, i) => i !== index));
    setSlugEdited((prev) => prev.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    const existing = await getSetting<{ value: UserSettingsModel }>(
      "core",
      "core:users"
    );
    const newValues: UserSettingsModel = {
      ...(existing?.value ?? {
        registrationOpen: true,
        defaultRole: "user",
        consentsEnabled: false,
        consents: [],
      }),
      consentsEnabled,
      consents,
    };
    await updateSetting("core", "core:users", newValues);
    setHasUnsavedChanges(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-6 w-10" />
        </div>
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-2 rounded-lg border p-4">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <div className="flex items-center justify-between rounded-lg border p-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <Label>{t("settings.consents.consentsEnabled")}</Label>
        <Switch
          checked={consentsEnabled}
          onCheckedChange={(checked) => {
            setConsentsEnabled(checked);
            setHasUnsavedChanges(true);
          }}
        />
      </div>

      {consentsEnabled && (
        <div className="space-y-4">
          {consents.map((consent, index) => (
            <div key={index} className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {consent.name || t("settings.consents.consentName")}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeConsent(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <div>
                  <Label>{t("settings.consents.consentName")}</Label>
                  <Input
                    value={consent.name}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleConsentChange(index, "name", value);
                      if (!slugEdited[index]) {
                        handleConsentChange(index, "slug", slugify(value));
                      }
                    }}
                  />
                </div>
                <div>
                  <Label>{t("settings.consents.consentSlug")}</Label>
                  <Input
                    value={consent.slug}
                    onChange={(e) => {
                      const value = slugify(e.target.value);
                      handleConsentChange(index, "slug", value);
                      setSlugEdited((prev) => {
                        const next = [...prev];
                        next[index] = true;
                        return next;
                      });
                    }}
                  />
                </div>
                <div>
                  <Label>{t("settings.consents.consentDescription")}</Label>
                  <Textarea
                    value={consent.description ?? ""}
                    onChange={(e) =>
                      handleConsentChange(index, "description", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-2">
                  <Label>{t("settings.consents.consentRequired")}</Label>
                  <Switch
                    checked={consent.required}
                    onCheckedChange={(checked) =>
                      handleConsentChange(index, "required", checked)
                    }
                  />
                </div>
              </div>
            </div>
          ))}
          <Button type="button" onClick={addConsent}>
            {t("settings.consents.addConsent")}
          </Button>
        </div>
      )}

      <div className="fixed bottom-4 right-4 p-4">
        <Button onClick={handleSave} disabled={!hasUnsavedChanges}>
          {t("buttons.save")}
        </Button>
      </div>
    </div>
  );
}

