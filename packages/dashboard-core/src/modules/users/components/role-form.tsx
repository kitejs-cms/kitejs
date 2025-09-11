import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { RoleResponseModel, PermissionResponseModel } from "@kitejs-cms/core/index";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { useTranslation } from "react-i18next";
import { XIcon } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";
import { Button } from "../../../components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/ui/form";
import { Input } from "../../../components/ui/input";
import { Checkbox } from "../../../components/ui/checkbox";
import { useApi } from "../../../hooks/use-api";

interface RoleFormProps {
  role?: RoleResponseModel;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RoleForm({ role, isOpen, onClose, onSuccess }: RoleFormProps) {
  const { t } = useTranslation("users");
  const { fetchData } = useApi<RoleResponseModel>();
  const {
    data: permissions,
    fetchData: fetchPermissions,
  } = useApi<PermissionResponseModel[]>();

  const groupedPermissions = useMemo(() => {
    if (!permissions) return {} as Record<string, (PermissionResponseModel & { action: string })[]>;

    const groups: Record<string, (PermissionResponseModel & { action: string })[]> = {};
    permissions.forEach((perm) => {
      const [nsResource, action] = perm.name.split(".");
      const resource = nsResource.split(":")[1] || nsResource;
      if (!groups[resource]) groups[resource] = [];
      groups[resource].push({ ...perm, action });
    });
    Object.values(groups).forEach((perms) =>
      perms.sort((a, b) => a.action.localeCompare(b.action))
    );
    return groups;
  }, [permissions]);

  const schema = z.object({
    name: z.string().min(1, { message: t("validation.required") }),
    description: z.string().optional(),
    permissions: z.array(z.string()).optional(),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      permissions: [] as string[],
    },
  });

  const isSystemRole = role?.source === "system";

  useEffect(() => {
    if (isOpen) {
      fetchPermissions("permissions");
    }
  }, [isOpen, fetchPermissions]);

  useEffect(() => {
    const defaultPermissions = role?.permissions
      ? role.permissions
          .map((name) => permissions?.find((p) => p.name === name)?.id)
          .filter(Boolean)
      : [];
    form.reset({
      name: role?.name || "",
      description: role?.description || "",
      permissions: defaultPermissions as string[],
    });
  }, [role, permissions, form]);

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (role) {
      const payload = isSystemRole ? { description: values.description } : values;
      await fetchData(`roles/${role.id}`, "PATCH", payload);
    } else {
      await fetchData("roles", "POST", values);
    }
    onClose();
    onSuccess();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="p-0 bg-white rounded-lg shadow-lg flex flex-col">
        <DialogHeader className="flex flex-row justify-between items-center p-4">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {role ? t("buttons.edit") : t("buttons.addRole")}
          </DialogTitle>
          <DialogClose className="flex items-center gap-2 text-gray-500 hover:text-black transition cursor-pointer">
            <Badge
              variant="outline"
              className="bg-gray-100 text-gray-400 border-gray-400 font-medium px-2 py-0.5"
            >
              Esc
            </Badge>
            <XIcon className="w-5 h-5" />
          </DialogClose>
        </DialogHeader>

        <Separator className="w-full" />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1">
            <ScrollArea className="flex-1 overflow-auto p-6">
              <div className="flex flex-col h-full gap-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      {t("fields.name")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("fields.name")}
                        disabled={isSystemRole}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      {t("fields.description")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("fields.description")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                <FormField
                  control={form.control}
                  name="permissions"
                  render={({ field }) => (
                    <FormItem className="flex flex-col flex-1">
                      <FormLabel className="text-xs">
                        {t("fields.permissions")}
                      </FormLabel>
                      <FormControl className="flex-1 overflow-y-auto">
                        <div className="space-y-4 pr-4">
                          {Object.entries(groupedPermissions)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([resource, perms]) => (
                              <div key={resource} className="space-y-1">
                                <div className="text-xs font-semibold capitalize text-muted-foreground">
                                  {resource.replace(/[-_]/g, " ")}
                                </div>
                                <div className="space-y-1 pl-4">
                                  {perms.map((perm) => (
                                    <div key={perm.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        checked={field.value?.includes(perm.id)}
                                        disabled={isSystemRole}
                                        onCheckedChange={(checked) => {
                                          if (isSystemRole) return;
                                          if (checked) {
                                            field.onChange([...(field.value || []), perm.id]);
                                          } else {
                                            field.onChange(
                                              (field.value || []).filter((p: string) => p !== perm.id)
                                            );
                                          }
                                        }}
                                      />
                                      <FormLabel
                                        className="text-xs"
                                        title={perm.description}
                                      >
                                        {perm.action.charAt(0).toUpperCase() +
                                          perm.action.slice(1)}
                                      </FormLabel>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            <Separator className="w-full" />
            <div className="flex justify-end gap-3 p-4">
              <Button variant="outline" onClick={onClose} type="button">
                {t("buttons.cancel")}
              </Button>
              <Button type="submit">{t("buttons.save")}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

