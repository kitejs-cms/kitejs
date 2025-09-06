import { useEffect } from "react";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useSettingsContext } from "../../../context/settings-context";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../../../components/ui/form";
import { Switch } from "../../../components/ui/switch";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { UserSettingsModel } from "@kitejs-cms/core/modules/settings/models/user-settings.model";

const consentSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  required: z.boolean(),
});

const formSchema = z.object({
  consentsEnabled: z.boolean(),
  consents: z.array(consentSchema),
});

type ConsentSettingsForm = z.infer<typeof formSchema>;

export function UserConsentSettings() {
  const { t } = useTranslation("users");
  const { getSetting, updateSetting, setHasUnsavedChanges } =
    useSettingsContext();

  const form = useForm<ConsentSettingsForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      consentsEnabled: false,
      consents: [],
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "consents",
  });

  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty, setHasUnsavedChanges]);

  useEffect(() => {
    (async () => {
      const setting = await getSetting<{ value: UserSettingsModel }>(
        "core",
        "core:users"
      );
      if (setting?.value) {
        reset({
          consentsEnabled: setting.value.consentsEnabled ?? false,
          consents: setting.value.consents || [],
        });
      }
    })();
  }, [getSetting, reset]);

  const onSubmit = async (values: ConsentSettingsForm) => {
    const existing = await getSetting<{ value: UserSettingsModel }>(
      "core",
      "core:users"
    );
    const newValues: UserSettingsModel = {
      ...(existing?.value ?? {
        registrationOpen: true,
        defaultRole: "",
        consentsEnabled: false,
        consents: [],
      }),
      ...values,
    };
    await updateSetting("core", "core:users", newValues);
    reset(values);
    setHasUnsavedChanges(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={control}
          name="consentsEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <FormLabel>{t("settings.consents.consentsEnabled")}</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {watch("consentsEnabled") && (
          <div className="space-y-4">
            {fields.map((item, index) => (
              <div key={item.id} className="space-y-2 rounded-lg border p-4">
                <FormField
                  control={control}
                  name={`consents.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("settings.consents.consentName")}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`consents.${index}.slug`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("settings.consents.consentSlug")}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`consents.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("settings.consents.consentDescription")}
                      </FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`consents.${index}.required`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <FormLabel>
                        {t("settings.consents.consentRequired")}
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
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => remove(index)}
                >
                  {t("buttons.delete")}
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={() =>
                append({
                  name: "",
                  slug: "",
                  description: "",
                  required: false,
                })
              }
            >
              {t("settings.consents.addConsent")}
            </Button>
          </div>
        )}
        <div className="fixed bottom-4 right-4 p-4">
          <Button type="submit" disabled={!isDirty}>
            {t("buttons.save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

