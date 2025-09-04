import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserResponseModel } from "@kitejs-cms/core/index";
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
import { useAuthContext } from "../../../context/auth-context";

interface ProfileFormProps {
  user: UserResponseModel;
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileForm({ user, isOpen, onClose }: ProfileFormProps) {
  const { t } = useTranslation("profile");
  const { fetchData } = useApi();
  const { roles } = useAuthContext();

  const schema = z.object({
    firstName: z.string().min(2, { message: t("validation.required") }),
    lastName: z.string().min(2, { message: t("validation.required") }),
    email: z.string().email({ message: t("validation.invalidEmail") }),
    roles: z.array(z.string()).optional(),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      roles: user?.roles || [],
    },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (user?.id) {
      await fetchData(`users/${user.id}/roles`, "PATCH", {
        roles: values.roles || [],
      });
    }
    onClose();
  };

  return (
    <Dialog onClose={onClose} open={isOpen}>
      <DialogContent className="p-0 bg-white rounded-lg shadow-lg flex flex-col">
        <DialogHeader className="flex flex-row justify-between items-center p-4">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {t("json-modal.title")}
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
                      <Input
                        {...field}
                        placeholder={t("placeholders.firstName")}
                      />
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
                      <Input
                        {...field}
                        placeholder={t("placeholders.lastName")}
                      />
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
                        disabled
                        type="email"
                        {...field}
                        placeholder={t("placeholders.email")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      {t("fields.roles")}
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {roles.map((role) => (
                          <div
                            key={role.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              checked={field.value?.includes(role.name)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...(field.value || []), role.name]);
                                } else {
                                  field.onChange(
                                    (field.value || []).filter(
                                      (r: string) => r !== role.name
                                    )
                                  );
                                }
                              }}
                            />
                            <FormLabel className="text-xs">
                              {role.name}
                            </FormLabel>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </ScrollArea>

        <Separator className="w-full" />

        <div className="flex justify-end gap-3 p-4">
          <Button variant="outline" onClick={onClose}>
            {t("buttons.cancel")}
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)}>
            {t("buttons.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
