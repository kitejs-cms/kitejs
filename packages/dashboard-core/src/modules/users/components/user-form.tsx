import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { MultiSelect } from "../../../components/multi-select";
import { useApi } from "../../../hooks/use-api";
import type { UserResponseModel, RoleResponseModel } from "@kitejs-cms/core/index";
import { useAuthContext } from "../../../context/auth-context";

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UserForm({ isOpen, onClose, onSuccess }: UserFormProps) {
  const { t } = useTranslation("users");
  const { fetchData } = useApi<UserResponseModel>();
  const { data: roles, fetchData: fetchRoles } = useApi<RoleResponseModel[]>();
  const { user } = useAuthContext();
  const isAdmin = user?.roles?.includes("admin");

  const schema = z.object({
    firstName: z.string().min(1, { message: t("validation.required") }),
    lastName: z.string().min(1, { message: t("validation.required") }),
    email: z.string().email({ message: t("validation.invalidEmail") }),
    password: z.string().min(8, { message: t("validation.passwordMin") }),
    roles: z.array(z.string()).optional(),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      roles: [],
    },
  });

  useEffect(() => {
    if (isOpen && isAdmin) {
      fetchRoles("roles");
    }
  }, [isOpen, isAdmin, fetchRoles]);

  const onSubmit = async (values: z.infer<typeof schema>) => {
    await fetchData("users", "POST", values);
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
            {t("buttons.add")}
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

        <ScrollArea className="flex-1 overflow-auto p-6 h-full">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      {t("fields.firstName")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("fields.firstName")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      {t("fields.lastName")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("fields.lastName")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      {t("fields.email")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        {...field}
                        placeholder={t("fields.email")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      {t("fields.password")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                        placeholder={t("fields.password")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isAdmin && (
                <FormField
                  control={form.control}
                  name="roles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">
                        {t("fields.roles")}
                      </FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={
                            roles?.map((role) => ({
                              value: role.id,
                              label:
                                role.name.charAt(0).toUpperCase() +
                                role.name.slice(1),
                            })) || []
                          }
                          initialTags={field.value || []}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={onClose} type="button">
                  {t("buttons.cancel")}
                </Button>
                <Button type="submit">{t("buttons.save")}</Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
