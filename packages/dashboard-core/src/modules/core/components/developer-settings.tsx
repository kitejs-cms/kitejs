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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

const storageSchema = z
  .object({
    provider: z.enum(["local", "s3"]),
    local: z
      .object({
        uploadPath: z.string().optional(),
        baseUrl: z.string().url().or(z.literal("")).optional(),
      })
      .optional(),
    s3: z
      .object({
        bucket: z.string().optional(),
        region: z.string().optional(),
        accessKeyId: z.string().optional(),
        secretAccessKey: z.string().optional(),
        endpoint: z.string().url().or(z.literal("")).optional(),
        forcePathStyle: z.boolean().optional(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.provider === "local") {
      if (!data.local?.uploadPath?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["local", "uploadPath"],
          message: "Upload path is required",
        });
      }
    } else if (data.provider === "s3") {
      const requiredFields = [
        "bucket",
        "region",
        "accessKeyId",
        "secretAccessKey",
      ] as const;
      for (const field of requiredFields) {
        const value = data.s3?.[field];
        if (!value || !value.toString().trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["s3", field],
            message: "Field is required",
          });
        }
      }
    }
  });

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
  storage: storageSchema,
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
      storage: {
        provider: "local",
        local: {
          uploadPath: "assets",
          baseUrl: "",
        },
        s3: {
          bucket: "",
          region: "",
          accessKeyId: "",
          secretAccessKey: "",
          endpoint: "",
          forcePathStyle: false,
        },
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
      const storageResponse = await getSetting<{
        value: DeveloperSettingsModel["storage"];
      }>("core", "core:storage");
      const storageDefaults = {
        provider: "local" as const,
        local: {
          uploadPath: "assets",
          baseUrl: "",
        },
        s3: {
          bucket: "",
          region: "",
          accessKeyId: "",
          secretAccessKey: "",
          endpoint: "",
          forcePathStyle: false,
        },
      } satisfies DeveloperSettingsModel["storage"];
      const storageValue = storageResponse?.value;
      const newValues = {
        cache: cacheResponse?.value ?? { enabled: true, ttl: 3600 },
        swagger: swaggerResponse?.value ?? {
          enabled: true,
          path: "api",
          title: "API Documentation",
          description: "",
          version: "1.0.0",
        },
        storage: {
          provider: storageValue?.provider ?? storageDefaults.provider,
          local: {
            uploadPath:
              storageValue?.local?.uploadPath ??
              storageDefaults.local.uploadPath,
            baseUrl: storageValue?.local?.baseUrl ?? "",
          },
          s3: {
            bucket: storageValue?.s3?.bucket ?? "",
            region: storageValue?.s3?.region ?? "",
            accessKeyId: storageValue?.s3?.accessKeyId ?? "",
            secretAccessKey:
              storageValue?.s3?.secretAccessKey ?? "",
            endpoint: storageValue?.s3?.endpoint ?? "",
            forcePathStyle: storageValue?.s3?.forcePathStyle ?? false,
          },
        },
      };
      reset(newValues);
    })();
  }, [getSetting, reset]);

  const cacheEnabled = watch("cache.enabled");
  const swaggerEnabled = watch("swagger.enabled");
  const selectedProvider = watch("storage.provider");

  const onSubmit = async (values: DeveloperSettingsModel) => {
    try {
      const sanitizeStorage = (
        storage: DeveloperSettingsModel["storage"]
      ): DeveloperSettingsModel["storage"] => {
        const sanitized: DeveloperSettingsModel["storage"] = {
          provider: storage.provider,
        };

        const localPath = storage.local?.uploadPath?.trim();
        if (localPath) {
          const baseUrl = storage.local?.baseUrl?.trim();
          sanitized.local = {
            uploadPath: localPath,
            ...(baseUrl ? { baseUrl } : {}),
          };
        }

        if (storage.s3) {
          const bucket = storage.s3.bucket?.trim();
          const region = storage.s3.region?.trim();
          const accessKeyId = storage.s3.accessKeyId?.trim();
          const secretAccessKey = storage.s3.secretAccessKey?.trim();
          const endpoint = storage.s3.endpoint?.trim();
          const hasCoreFields =
            bucket && region && accessKeyId && secretAccessKey;

          if (hasCoreFields) {
            sanitized.s3 = {
              bucket,
              region,
              accessKeyId,
              secretAccessKey,
              ...(endpoint ? { endpoint } : {}),
              ...(typeof storage.s3.forcePathStyle === "boolean"
                ? { forcePathStyle: storage.s3.forcePathStyle }
                : {}),
            };
          }
        }

        return sanitized;
      };

      const storagePayload = sanitizeStorage(values.storage);

      if (dirtyFields.cache) {
        await updateSetting("core", "core:cache", values.cache);
      }
      if (dirtyFields.swagger) {
        await updateSetting("core", "core:swagger", values.swagger);
      }
      if (dirtyFields.storage) {
        await updateSetting("core", "core:storage", storagePayload);
      }
      console.log("Settings updated successfully:", values);
      // Dopo il salvataggio, resetta il form e lo stato dei cambiamenti non salvati
      reset({
        cache: values.cache,
        swagger: values.swagger,
        storage: {
          ...values.storage,
          local: {
            uploadPath: values.storage.local?.uploadPath ?? "",
            baseUrl: values.storage.local?.baseUrl ?? "",
          },
          s3: {
            bucket: values.storage.s3?.bucket ?? "",
            region: values.storage.s3?.region ?? "",
            accessKeyId: values.storage.s3?.accessKeyId ?? "",
            secretAccessKey: values.storage.s3?.secretAccessKey ?? "",
            endpoint: values.storage.s3?.endpoint ?? "",
            forcePathStyle: values.storage.s3?.forcePathStyle ?? false,
          },
        },
      });
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

        {/* Storage */}
        <div className="rounded-lg border p-6 shadow-sm shadow-neutral-100">
          <h3 className="mb-4 text-lg font-medium">
            {t("settings.developer.storage.title")}
          </h3>
          <FormField
            control={methods.control}
            name="storage.provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("settings.developer.storage.provider")}
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t(
                          "settings.developer.storage.provider"
                        )}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="local">
                      {t("settings.developer.storage.providers.local")}
                    </SelectItem>
                    <SelectItem value="s3">
                      {t("settings.developer.storage.providers.s3")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedProvider === "local" && (
            <div className="mt-6 space-y-4">
              <FormField
                control={methods.control}
                name="storage.local.uploadPath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("settings.developer.storage.local.uploadPath")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={methods.control}
                name="storage.local.baseUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("settings.developer.storage.local.baseUrl")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {selectedProvider === "s3" && (
            <div className="mt-6 space-y-4">
              <FormField
                control={methods.control}
                name="storage.s3.bucket"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("settings.developer.storage.s3.bucket")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={methods.control}
                name="storage.s3.region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("settings.developer.storage.s3.region")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={methods.control}
                name="storage.s3.accessKeyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("settings.developer.storage.s3.accessKeyId")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={methods.control}
                name="storage.s3.secretAccessKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("settings.developer.storage.s3.secretAccessKey")}
                    </FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={methods.control}
                name="storage.s3.endpoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("settings.developer.storage.s3.endpoint")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={methods.control}
                name="storage.s3.forcePathStyle"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border px-2 py-2 shadow-sm shadow-neutral-50">
                    <FormLabel className="text-sm">
                      {t("settings.developer.storage.s3.forcePathStyle")}
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}
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
