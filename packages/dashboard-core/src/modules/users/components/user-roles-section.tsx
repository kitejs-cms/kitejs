import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useApi } from "../../../hooks/use-api";
import type { RoleResponseModel } from "@kitejs-cms/core/index";
import { Button } from "../../../components/ui/button";
import { Checkbox } from "../../../components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "../../../components/ui/form";

interface UserRolesSectionProps {
  userId: string;
  roles: string[];
}

export function UserRolesSection({ userId, roles }: UserRolesSectionProps) {
  const { t } = useTranslation("users");
  const { data: allRoles, fetchData: fetchRoles } = useApi<RoleResponseModel[]>();
  const { fetchData } = useApi();

  const schema = z.object({
    roles: z.array(z.string()).optional(),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { roles: roles || [] },
  });

  useEffect(() => {
    fetchRoles("roles");
  }, [fetchRoles]);

  const onSubmit = async (values: z.infer<typeof schema>) => {
    await fetchData(`users/${userId}`, "PATCH", { roles: values.roles });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="roles"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">{t("fields.roles")}</FormLabel>
              <FormControl>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {allRoles?.map((role) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={field.value?.includes(role.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange([...(field.value || []), role.id]);
                          } else {
                            field.onChange(
                              (field.value || []).filter((r: string) => r !== role.id)
                            );
                          }
                        }}
                      />
                      <FormLabel className="text-xs">{role.name}</FormLabel>
                    </div>
                  ))}
                </div>
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm">
            {t("buttons.save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
