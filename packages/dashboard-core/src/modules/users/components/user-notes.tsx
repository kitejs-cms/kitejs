import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/ui/form";
import { useApi } from "../../../hooks/use-api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Separator } from "../../../components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";

interface UserNoteModel {
  id: string;
  content: string;
  source: string;
  createdAt: string;
}

interface UserNotesProps {
  userId: string;
  canAddNote: boolean;
}

export function UserNotes({ userId, canAddNote }: UserNotesProps) {
  const { t } = useTranslation("users");
  const { data: notes, fetchData } = useApi<UserNoteModel[]>();
  const { fetchData: sendNote } = useApi<UserNoteModel>();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "admin" | "system">("all");

  const schema = z.object({
    content: z.string().min(1, { message: t("validation.required") }),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { content: "" },
  });

  useEffect(() => {
    fetchData(`users/${userId}/notes`);
  }, [fetchData, userId]);

  const onSubmit = async (values: z.infer<typeof schema>) => {
    await sendNote(`users/${userId}/notes`, "POST", values);
    await fetchData(`users/${userId}/notes`);
    form.reset();
    setOpen(false);
  };

  const filteredNotes =
    notes?.filter((n) => filter === "all" || n.source === filter) || [];

  return (
    <>
      {canAddNote && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("buttons.addNote")}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">
                        {t("fields.notes")}
                      </FormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-[80px]" />
                      </FormControl>
                      <FormMessage />
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
          </DialogContent>
        </Dialog>
      )}

      <Card className="w-full shadow-neutral-50 gap-0 py-0">
        <CardHeader className="bg-neutral-50 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <CardTitle>{t("fields.notes")}</CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={filter}
                onValueChange={(v) => setFilter(v as "all" | "admin" | "system")}
              >
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder={t("notesFilter.all")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("notesFilter.all")}</SelectItem>
                  <SelectItem value="admin">{t("notesFilter.admin")}</SelectItem>
                  <SelectItem value="system">{t("notesFilter.system")}</SelectItem>
                </SelectContent>
              </Select>
              {canAddNote && (
                <Button size="sm" onClick={() => setOpen(true)}>
                  {t("buttons.addNote")}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-4">
          {filteredNotes.length ? (
            <ul className="relative border-l pl-4">
              {filteredNotes.map((note) => (
                <li key={note.id} className="mb-4 ml-2">
                  <span className="absolute -left-4 top-2 w-2 h-2 rounded-full bg-gray-400"></span>
                  <details>
                    <summary className="cursor-pointer text-sm select-none">
                      {new Date(note.createdAt).toLocaleString()} - {note.source}
                    </summary>
                    <p className="mt-2 text-sm">{note.content}</p>
                  </details>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">{t("empty")}</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

