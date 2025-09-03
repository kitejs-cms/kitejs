import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { RoleResponseModel } from "@kitejs-cms/core/index";
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

  const schema = z.object({
    name: z.string().min(1, { message: t("validation.required") }),
    description: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (role) {
      await fetchData(`roles/${role.id}`, "PATCH", values);
    } else {
      await fetchData("roles", "POST", values);
    }
    onClose();
    onSuccess();
  };

  return (
    <Dialog onClose={onClose} open={isOpen}>
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

        <ScrollArea className="flex-1 overflow-auto p-6 h-full">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      {t("fields.name")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("fields.name")} />
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

