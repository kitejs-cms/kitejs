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
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Badge } from "../../../components/ui/badge";
import { XIcon, PlusIcon, Trash2Icon, PencilIcon } from "lucide-react";

interface UserNoteModel {
  id: string;
  content: string;
  source: string;
  createdAt: string;
  createdBy?: string;
}

interface UserNotesProps {
  userId: string;
  canAddNote: boolean;
}

export function UserNotes({ userId, canAddNote }: UserNotesProps) {
  const { t } = useTranslation("users");
  const { data: notes, fetchData } = useApi<UserNoteModel[]>();
  const { fetchData: sendNote } = useApi<UserNoteModel>();
  const { fetchData: removeNote } = useApi<void>();
  const { fetchData: editNote } = useApi<UserNoteModel>();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "admin" | "system">("all");
  const [editing, setEditing] = useState<UserNoteModel | null>(null);

  const schema = z.object({
    content: z.string().min(1, { message: t("validation.required") }),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { content: "" },
  });

  useEffect(() => {
    fetchData(`notes?targetType=user&targetId=${userId}`);
  }, [fetchData, userId]);

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (editing) {
      await editNote(`notes/${editing.id}`, "PATCH", values);
    } else {
      await sendNote(`notes`, "POST", {
        ...values,
        targetId: userId,
        targetType: "user",
        source: "admin",
      });
    }
    await fetchData(`notes?targetType=user&targetId=${userId}`);
    form.reset();
    setEditing(null);
    setOpen(false);
  };

  const filteredNotes =
    notes?.filter((n) => filter === "all" || n.source === filter) || [];

  const handleDelete = async (id: string) => {
    await removeNote(`notes/${id}`, "DELETE");
    await fetchData(`notes?targetType=user&targetId=${userId}`);
  };

  return (
    <>
      {canAddNote && (
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) {
              setEditing(null);
              form.reset({ content: "" });
            }
          }}
        >
          <DialogContent className="p-0 bg-white rounded-lg shadow-lg flex flex-col">
            <DialogHeader className="flex flex-row justify-between items-center p-4">
              <DialogTitle>
                {editing ? t("buttons.edit") : t("buttons.addNote")}
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
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col flex-1"
              >
                <div className="p-4 flex-1 space-y-4">
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
                </div>
                <DialogFooter className="p-4 mt-auto">
                  <DialogClose asChild>
                    <Button variant="outline" size="sm" type="button">
                      {t("buttons.cancel")}
                    </Button>
                  </DialogClose>
                  <Button type="submit" size="sm">
                    {t("buttons.save")}
                  </Button>
                </DialogFooter>
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
                <Button
                  size="icon"
                  variant="outline"
                  className="shadow-none"
                  onClick={() => {
                    setEditing(null);
                    form.reset({ content: "" });
                    setOpen(true);
                  }}
                >
                  <PlusIcon className="h-4 w-4" />
                  <span className="sr-only">{t("buttons.addNote")}</span>
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
                  <span className="absolute -left-4 top-4 w-2 h-2 rounded-full bg-gray-400"></span>
                  <div className="border rounded-md p-3 bg-white shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="text-xs text-gray-500">
                        <p>{new Date(note.createdAt).toLocaleString()}</p>
                        {note.createdBy && <p>{note.createdBy}</p>}
                      </div>
                      {note.source === "admin" && canAddNote && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-500 hover:text-blue-600"
                            onClick={() => {
                              setEditing(note);
                              form.reset({ content: note.content });
                              setOpen(true);
                            }}
                          >
                            <PencilIcon className="h-4 w-4" />
                            <span className="sr-only">{t("buttons.edit")}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-500 hover:text-red-600"
                            onClick={() => handleDelete(note.id)}
                          >
                            <Trash2Icon className="h-4 w-4" />
                            <span className="sr-only">{t("buttons.delete")}</span>
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-sm whitespace-pre-line">{note.content}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex justify-center py-8">
              <p className="text-sm text-gray-500 italic">
                {t("noNotes")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

