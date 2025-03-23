import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Switch } from "../../../components/ui/switch";
import { ExternalLink } from "lucide-react";
import { useSettingsContext } from "../../../context/settings-context";
import { useEffect } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../../../components/ui/form";

const formSchema = z.object({
  cache: z.object({
    enabled: z.boolean(),
    ttl: z.number().min(0),
  }),
  swagger: z.object({
    enabled: z.boolean(),
    path: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
    version: z.string(),
  }),
});

type DeveloperSettingsModel = z.infer<typeof formSchema>;

export function DeveloperSettings() {
  const { t } = useTranslation("core");
  const { getSetting, updateSetting, setHasUnsavedChanges } =
    useSettingsContext();

  const methods = useForm<DeveloperSettingsModel>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cache: {
        enabled: true,
        ttl: 3600,
      },
      swagger: {
        enabled: true,
        path: "api",
        title: "API Documentation",
        description: "",
        version: "1.0.0",
      },
    },
  });

  const {
    handleSubmit,
    watch,
    reset,
    formState: { isDirty, dirtyFields },
  } = methods;

  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty, setHasUnsavedChanges]);

  useEffect(() => {
    (async () => {
      const cacheResponse = await getSetting<{
        value: DeveloperSettingsModel["cache"];
      }>("core", "core:cache");
      const swaggerResponse = await getSetting<{
        value: DeveloperSettingsModel["swagger"];
      }>("core", "core:swagger");
      const newValues = {
        cache: cacheResponse?.value ?? { enabled: true, ttl: 3600 },
        swagger: swaggerResponse?.value ?? {
          enabled: true,
          path: "api",
          title: "API Documentation",
          description: "",
          version: "1.0.0",
        },
      };
      reset(newValues);
    })();
  }, [getSetting, reset]);

  const cacheEnabled = watch("cache.enabled");
  const swaggerEnabled = watch("swagger.enabled");

  const onSubmit = async (values: DeveloperSettingsModel) => {
    try {
      if (dirtyFields.cache) {
        await updateSetting("core", "core:cache", values.cache);
      }
      if (dirtyFields.swagger) {
        await updateSetting("core", "core:swagger", values.swagger);
      }
      console.log("Settings updated successfully:", values);
      // Dopo il salvataggio, resetta il form e lo stato dei cambiamenti non salvati
      reset(values);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to update developer settings:", error);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Cache */}
        <div className="rounded-lg border p-6 shadow-sm shadow-neutral-100">
          <h3 className="mb-4 text-lg font-medium">Cache Settings</h3>
          <FormField
            control={methods.control}
            name="cache.enabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border px-2 py-2 shadow-sm shadow-neutral-50">
                <FormLabel className="text-sm">
                  {t("settings.developer.cache.enabled")}
                </FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={methods.control}
            name="cache.ttl"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>{t("settings.developer.cache.ttl")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    disabled={!cacheEnabled}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Swagger */}
        <div className="rounded-lg border p-6 shadow-sm shadow-neutral-100">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium">Swagger Settings</h3>
            <Button
              disabled={!swaggerEnabled}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              onClick={() =>
                window.open(`/${watch("swagger.path")}/docs`, "_blank")
              }
            >
              <ExternalLink />
              {t("common.open_swagger", "Open Swagger")}
            </Button>
          </div>
          <FormField
            control={methods.control}
            name="swagger.enabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border px-2 py-2 shadow-sm shadow-neutral-50">
                <FormLabel className="text-sm">
                  {t("settings.developer.swagger.enabled")}
                </FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={methods.control}
            name="swagger.path"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>{t("settings.developer.swagger.path")}</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!swaggerEnabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={methods.control}
            name="swagger.title"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>{t("settings.developer.swagger.title")}</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!swaggerEnabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={methods.control}
            name="swagger.description"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>
                  {t("settings.developer.swagger.description")}
                </FormLabel>
                <FormControl>
                  <Input {...field} disabled={!swaggerEnabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={methods.control}
            name="swagger.version"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>{t("settings.developer.swagger.version")}</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!swaggerEnabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Bottone Salva, posizionato in fondo */}
        <div className="fixed bottom-4 right-4 p-4">
          <Button type="submit" disabled={!isDirty}>
            {t("common.save", "Save")}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
