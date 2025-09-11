import { useForm } from "react-hook-form";
import { useState } from "react";
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
import { XIcon } from "lucide-react";
import { useApi } from "../../../hooks/use-api";
import { toast } from "sonner";

interface ChangePasswordFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordForm({ isOpen, onClose }: ChangePasswordFormProps) {
  const { t } = useTranslation("profile");
  const { fetchData } = useApi();
  const [strength, setStrength] = useState(0);
  const calculateStrength = (value: string) => {
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    return score;
  };
  const strengthClasses = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-green-700",
  ];

  const schema = z
    .object({
      oldPassword: z.string().min(1, { message: t("validation.required") }),
      newPassword: z
        .string()
        .min(8, { message: t("validation.passwordMin") })
        .refine((val) => calculateStrength(val) >= 3, {
          message: t("validation.passwordWeak"),
        }),
      confirmPassword: z.string().min(1, { message: t("validation.required") }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      path: ["confirmPassword"],
      message: t("validation.passwordMismatch"),
    });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    const { error } = await fetchData(
      "auth/change-password",
      "POST",
      {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      }
    );

    if (error) {
      const errorKey: Record<string, string> = {
        "Old password is incorrect.": "errors.oldPasswordIncorrect",
        "New password cannot be the same as the old password.":
          "errors.passwordSame",
        "User not found.": "errors.userNotFound",
      };
      toast.error(t(errorKey[error] || "errors.generic"));
      return;
    }

    toast.success(t("success.passwordChanged"));
    onClose();
    form.reset();
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
            {t("password.title")}
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
                name="oldPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      {t("password.fields.oldPassword")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder={t("password.placeholders.oldPassword")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      {t("password.fields.newPassword")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder={t("password.placeholders.newPassword")}
                        onChange={(e) => {
                          field.onChange(e);
                          setStrength(calculateStrength(e.target.value));
                        }}
                      />
                    </FormControl>
                    <div className="h-1 w-full bg-gray-200 rounded mt-1">
                      <div
                        className={`h-full rounded ${strengthClasses[strength]}`}
                        style={{ width: `${((strength + 1) / 5) * 100}%` }}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      {t("password.fields.confirmPassword")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder={t("password.placeholders.confirmPassword")}
                      />
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

