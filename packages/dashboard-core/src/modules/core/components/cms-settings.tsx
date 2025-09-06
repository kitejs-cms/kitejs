import { Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/ui/form";
import { Input } from "../../../components/ui/input";
import { Switch } from "../../../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { MultiSelect } from "../../../components/multi-select";
import { Button } from "../../../components/ui/button";
import { type CmsSettingsModel } from "@kitejs-cms/core/modules/settings/models/cms-settings.model";
import { useSettingsContext } from "../../../context/settings-context";

const formSchema = z.object({
  siteName: z.string().min(1, "Site name is required"),
  siteUrl: z.string().url("Must be a valid URL"),
  siteDescription: z.string().optional(),
  supportedLanguages: z
    .array(z.string())
    .nonempty("Supported languages are required"),
  defaultLanguage: z.string().min(1, "Default language is required"),
  allowIndexing: z.boolean(),
});

const languageCodes = ["en", "it", "es", "fr", "de"] as const;

export function CmsSettings() {
  const { t } = useTranslation("core");
  const { cmsSettings, updateSetting, setHasUnsavedChanges } =
    useSettingsContext();
  const languageOptions = useMemo(
    () =>
      languageCodes.map((code) => ({
        value: code,
        label: t(`settings.cms.settings.languages.${code}`),
      })),
    [t]
  );
  const form = useForm<CmsSettingsModel>({
    resolver: zodResolver(formSchema) as unknown as Resolver<CmsSettingsModel>,
    defaultValues: {
      siteName: "",
      siteUrl: "",
      apiUrl: "",
      siteDescription: "",
      defaultLanguage: "en",
      supportedLanguages: ["en"],
      allowIndexing: true,
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = form;

  useEffect(() => {
    if (cmsSettings) {
      reset({
        ...cmsSettings,
        apiUrl: cmsSettings.apiUrl ?? "",
        supportedLanguages: Array.from(
          new Set([
            ...(cmsSettings.supportedLanguages ?? []),
            cmsSettings.defaultLanguage,
          ])
        ),
      });
    }
  }, [cmsSettings, reset]);

  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty, setHasUnsavedChanges]);

  const onSubmit = async (values: CmsSettingsModel) => {
    try {
      const newValues: CmsSettingsModel = {
        ...values,
        supportedLanguages: Array.from(
          new Set([...(values.supportedLanguages ?? []), values.defaultLanguage])
        ),
      };
      await updateSetting("core", "core:cms", newValues);
      reset(newValues);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to update CMS settings:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="siteName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("settings.cms.settings.siteName")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="siteUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("settings.cms.settings.siteUrl")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="siteDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("settings.cms.settings.siteDescription")}
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="supportedLanguages"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("settings.cms.settings.supportedLanguages")}
              </FormLabel>
              <FormControl>
                <MultiSelect
                  options={languageOptions}
                  initialTags={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="defaultLanguage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("settings.cms.settings.defaultLanguage")}
              </FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("settings.cms.settings.selectLanguage")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                  {form.watch("supportedLanguages")?.map((lang) => {
                    const option = languageOptions.find((opt) => opt.value === lang);
                    return (
                      <SelectItem key={lang} value={lang}>
                        {option?.label || lang}
                      </SelectItem>
                    );
                  })}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="allowIndexing"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  {t("settings.cms.settings.allowIndexing")}
                </FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="fixed bottom-4 right-4 p-4">
          <Button type="submit" disabled={!isDirty}>
            {t("common.save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
