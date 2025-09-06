import { Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
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
import { Button } from "../../../components/ui/button";
import { type CmsSettingsModel } from "@kitejs-cms/core/modules/settings/models/cms-settings.model";
import { useSettingsContext } from "../../../context/settings-context";

const formSchema = z.object({
  siteName: z.string().min(1, "Site name is required"),
  siteUrl: z.string().url("Must be a valid URL"),
  siteDescription: z.string().optional(),
  defaultLanguage: z.string().min(1, "Default language is required"),
  allowIndexing: z.boolean(),
});

export function CmsSettings() {
  const { t } = useTranslation();
  const { cmsSettings, updateSetting, setHasUnsavedChanges } =
    useSettingsContext();
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
      });
    }
  }, [cmsSettings, reset]);

  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty, setHasUnsavedChanges]);

  const onSubmit = async (values: CmsSettingsModel) => {
    try {
      await updateSetting("core", "core:cms", values);
      reset(values);
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
              <FormLabel>{t("settings:cms.settings.siteName")}</FormLabel>
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
              <FormLabel>{t("settings:cms.settings.siteUrl")}</FormLabel>
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
                {t("settings:cms.settings.siteDescription")}
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
          name="defaultLanguage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("settings:cms.settings.defaultLanguage")}
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                </SelectContent>
              </Select>
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
                  {t("settings:cms.settings.allowIndexing")}
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

        <Button type="submit">{t("settings:common.save")}</Button>
      </form>
    </Form>
  );
}
