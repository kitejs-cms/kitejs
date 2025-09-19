import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { FieldDefinition } from "@kitejs-cms/core";
import {
  Button,
  Input,
  Label,
  Separator,
  Skeleton,
  Switch,
  useSettingsContext,
} from "@kitejs-cms/dashboard-core";
import { CustomFieldBuilder } from "@kitejs-cms/dashboard-core/components/custom-field-builder";
import type { CommercePluginSettingsModel } from "@kitejs-cms/plugin-commerce-api";
import {
  COMMERCE_PLUGIN_NAMESPACE,
  COMMERCE_SETTINGS_KEY,
} from "../constants";

const DEFAULT_SETTINGS: CommercePluginSettingsModel = {
  defaultCurrency: "EUR",
  allowGuestCheckout: true,
  taxInclusivePricing: false,
  customProductFields: [],
  customCustomerAddressFields: [],
};

export function CommerceSettings() {
  const { t } = useTranslation("commerce");
  const {
    getSetting,
    updateSetting,
    hasUnsavedChanges,
    setHasUnsavedChanges,
  } = useSettingsContext();

  const [isLoading, setIsLoading] = useState(true);
  const [defaultCurrency, setDefaultCurrency] = useState(
    DEFAULT_SETTINGS.defaultCurrency
  );
  const [allowGuestCheckout, setAllowGuestCheckout] = useState(
    DEFAULT_SETTINGS.allowGuestCheckout
  );
  const [taxInclusivePricing, setTaxInclusivePricing] = useState(
    DEFAULT_SETTINGS.taxInclusivePricing
  );
  const [productFields, setProductFields] = useState<FieldDefinition[]>(
    DEFAULT_SETTINGS.customProductFields ?? []
  );
  const [addressFields, setAddressFields] = useState<FieldDefinition[]>(
    DEFAULT_SETTINGS.customCustomerAddressFields ?? []
  );

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const { value } = await getSetting<{ value: CommercePluginSettingsModel }>(
          COMMERCE_PLUGIN_NAMESPACE,
          COMMERCE_SETTINGS_KEY
        );
        if (value) {
          setDefaultCurrency(value.defaultCurrency ?? DEFAULT_SETTINGS.defaultCurrency);
          setAllowGuestCheckout(
            value.allowGuestCheckout ?? DEFAULT_SETTINGS.allowGuestCheckout
          );
          setTaxInclusivePricing(
            value.taxInclusivePricing ?? DEFAULT_SETTINGS.taxInclusivePricing
          );
          setProductFields(value.customProductFields ?? []);
          setAddressFields(value.customCustomerAddressFields ?? []);
        }
      } catch (error) {
        console.error("Failed to load commerce settings", error);
      } finally {
        setIsLoading(false);
        setHasUnsavedChanges(false);
      }
    };

    void loadSettings();
  }, [getSetting, setHasUnsavedChanges]);

  const markDirty = () => {
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateSetting(COMMERCE_PLUGIN_NAMESPACE, COMMERCE_SETTINGS_KEY, {
        defaultCurrency,
        allowGuestCheckout,
        taxInclusivePricing,
        customProductFields: productFields,
        customCustomerAddressFields: addressFields,
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save commerce settings", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generalDescription = useMemo(
    () => t("settings.sections.general.description"),
    [t]
  );

  if (isLoading && !hasUnsavedChanges) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16">
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">
            {t("settings.sections.general.title")}
          </h2>
          <p className="text-sm text-muted-foreground">{generalDescription}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="defaultCurrency">
              {t("settings.fields.defaultCurrency.label")}
            </Label>
            <Input
              id="defaultCurrency"
              value={defaultCurrency}
              onChange={(event) => {
                setDefaultCurrency(event.target.value.toUpperCase());
                markDirty();
              }}
              maxLength={3}
            />
            <p className="text-xs text-muted-foreground">
              {t("settings.fields.defaultCurrency.description")}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="allowGuestCheckout">
              {t("settings.fields.allowGuestCheckout.label")}
            </Label>
            <div className="flex items-center justify-between rounded-md border p-4">
              <div className="space-y-1 pr-4">
                <p className="text-sm font-medium">
                  {t("settings.fields.allowGuestCheckout.title")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("settings.fields.allowGuestCheckout.description")}
                </p>
              </div>
              <Switch
                id="allowGuestCheckout"
                checked={allowGuestCheckout}
                onCheckedChange={(checked) => {
                  setAllowGuestCheckout(checked);
                  markDirty();
                }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxInclusivePricing">
              {t("settings.fields.taxInclusivePricing.label")}
            </Label>
            <div className="flex items-center justify-between rounded-md border p-4">
              <div className="space-y-1 pr-4">
                <p className="text-sm font-medium">
                  {t("settings.fields.taxInclusivePricing.title")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("settings.fields.taxInclusivePricing.description")}
                </p>
              </div>
              <Switch
                id="taxInclusivePricing"
                checked={taxInclusivePricing}
                onCheckedChange={(checked) => {
                  setTaxInclusivePricing(checked);
                  markDirty();
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">
            {t("settings.sections.productFields.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("settings.sections.productFields.description")}
          </p>
        </div>
        <CustomFieldBuilder
          value={productFields}
          onChange={(fields) => {
            setProductFields(fields);
            markDirty();
          }}
        />
      </section>

      <Separator />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">
            {t("settings.sections.addressFields.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("settings.sections.addressFields.description")}
          </p>
        </div>
        <CustomFieldBuilder
          value={addressFields}
          onChange={(fields) => {
            setAddressFields(fields);
            markDirty();
          }}
        />
      </section>

      <div className="sticky bottom-6 flex justify-end">
        <Button onClick={handleSave} disabled={!hasUnsavedChanges}>
          {t("settings.actions.save")}
        </Button>
      </div>
    </div>
  );
}
