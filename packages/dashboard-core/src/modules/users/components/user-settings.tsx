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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { useApi } from "../../../hooks/use-api";
import { RoleResponseModel } from "@kitejs-cms/core/modules/users/models/role-response.model";

const consentSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  required: z.boolean(),
});

const formSchema = z.object({
  registrationOpen: z.boolean(),
  defaultRole: z.string().min(1),
  consentsEnabled: z.boolean(),
  consents: z.array(consentSchema),
});

type UserSettingsForm = z.infer<typeof formSchema>;

export function UserSettings() {
  const { t } = useTranslation("users");
  const { getSetting, updateSetting, setHasUnsavedChanges } = useSettingsContext();
  const { data: roles, fetchData } = useApi<RoleResponseModel[]>();

  const form = useForm<UserSettingsForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      registrationOpen: true,
      defaultRole: "",
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

  const { fields, append, remove } = useFieldArray({ control, name: "consents" });

  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty, setHasUnsavedChanges]);

  useEffect(() => {
    (async () => {
      const setting = await getSetting<{ value: UserSettingsForm }>(
        "core",
        "core:users"
      );
      if (setting?.value) {
        reset({
          registrationOpen: setting.value.registrationOpen,
          defaultRole: setting.value.defaultRole,
          consentsEnabled: setting.value.consentsEnabled ?? false,
          consents: setting.value.consents || [],
        });
      }
      fetchData("roles");
    })();
  }, [getSetting, reset, fetchData]);

  const onSubmit = async (values: UserSettingsForm) => {
    await updateSetting("core", "core:users", values);
    reset(values);
    setHasUnsavedChanges(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={control}
          name="registrationOpen"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <FormLabel>{t("settings.registrationOpen")}</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="defaultRole"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("settings.defaultRole")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="consentsEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <FormLabel>{t("settings.consentsEnabled")}</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {watch("consentsEnabled") && (
          <div className="space-y-4">
            {fields.map((item, index) => (
              <div
                key={item.id}
                className="space-y-2 rounded-lg border p-4"
              >
                <FormField
                  control={control}
                  name={`consents.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.consentName")}</FormLabel>
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
                      <FormLabel>{t("settings.consentSlug")}</FormLabel>
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
                      <FormLabel>{t("settings.consentDescription")}</FormLabel>
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
                      <FormLabel>{t("settings.consentRequired")}</FormLabel>
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
                append({ name: "", slug: "", description: "", required: false })
              }
            >
              {t("settings.addConsent")}
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

