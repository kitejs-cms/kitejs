import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useSettingsContext } from "../../../context/settings-context";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "../../../components/ui/form";
import { Switch } from "../../../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Button } from "../../../components/ui/button";
import { useApi } from "../../../hooks/use-api";
import { RoleResponseModel } from "@kitejs-cms/core/modules/users/models/role-response.model";
import { TagsInput } from "../../../components/tag-input";

const formSchema = z.object({
  registrationOpen: z.boolean(),
  defaultRole: z.string().min(1),
  requiredConsents: z.array(z.string()),
});

type UserSettingsForm = z.infer<typeof formSchema>;

export function UserSettings() {
  const { t } = useTranslation("users");
  const { getSetting, updateSetting, setHasUnsavedChanges } = useSettingsContext();
  const { data: roles, fetchData } = useApi<RoleResponseModel[]>();

  const form = useForm<UserSettingsForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { registrationOpen: true, defaultRole: "", requiredConsents: [] },
  });

  const { handleSubmit, reset, formState: { isDirty } } = form;

  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty, setHasUnsavedChanges]);

  useEffect(() => {
    (async () => {
      const setting = await getSetting<{ value: UserSettingsForm }>("core", "core:users");
      if (setting?.value) {
        reset({
          registrationOpen: setting.value.registrationOpen,
          defaultRole: setting.value.defaultRole,
          requiredConsents: setting.value.requiredConsents || [],
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
          control={form.control}
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
          control={form.control}
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
          control={form.control}
          name="requiredConsents"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("settings.requiredConsents")}</FormLabel>
              <FormControl>
                <TagsInput initialTags={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="fixed bottom-4 right-4 p-4">
          <Button type="submit" disabled={!isDirty}>{t("buttons.save")}</Button>
        </div>
      </form>
    </Form>
  );
}
