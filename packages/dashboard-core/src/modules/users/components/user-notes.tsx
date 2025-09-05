import { useEffect, useState, useCallback } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import { Badge } from "../../../components/ui/badge";
import {
  XIcon,
  PlusIcon,
  Trash2Icon,
  PencilIcon,
  StickyNote,
} from "lucide-react";

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
  const { fetchData } = useApi<UserNoteModel[]>();
  const { fetchData: sendNote } = useApi<UserNoteModel>();
  const { fetchData: removeNote } = useApi<void>();
  const { fetchData: editNote } = useApi<UserNoteModel>();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "admin" | "system">("all");
  const [editing, setEditing] = useState<UserNoteModel | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [notes, setNotes] = useState<UserNoteModel[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 5;

  const schema = z.object({
    content: z.string().min(1, { message: t("validation.required") }),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { content: "" },
  });

  const loadNotes = useCallback(
    async (skip: number) => {
      const sourceParam = filter !== "all" ? `&source=${filter}` : "";
      const { data } = await fetchData(
        `notes?targetType=user&targetId=${userId}${sourceParam}&skip=${skip}&limit=${limit + 1}`
      );
      const fetched = data || [];
      setHasMore(fetched.length > limit);
      const slice = fetched.slice(0, limit);
      setNotes((prev) => (skip === 0 ? slice : [...prev, ...slice]));
      setOffset(skip + slice.length);
    },
    [fetchData, filter, userId]
  );

  useEffect(() => {
    loadNotes(0);
  }, [loadNotes]);

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
    await loadNotes(0);
    form.reset();
    setEditing(null);
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setNoteToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;
    await removeNote(`notes/${noteToDelete}`, "DELETE");
    setConfirmOpen(false);
    setNoteToDelete(null);
    await loadNotes(0);
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
          {notes.length ? (
            <>
              <ul className="relative pl-4 space-y-6 before:absolute before:left-2 before:top-0 before:bottom-0 before:w-px before:bg-border">
                {notes.map((note) => (
                  <li key={note.id} className="relative pl-6">
                    <span className="absolute -left-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-primary ring-2 ring-background" />
                    <div className="border rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between">
                        <div className="text-xs text-muted-foreground">
                          <p>{new Date(note.createdAt).toLocaleString()}</p>
                          {note.createdBy && <p>{note.createdBy}</p>}
                        </div>
                        {note.source === "admin" && canAddNote && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-gray-500 hover:text-gray-700 hover:bg-transparent"
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
                              className="h-6 w-6 text-gray-500 hover:text-gray-700 hover:bg-transparent"
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
              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadNotes(offset)}
                  >
                    {t("buttons.loadMore")}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <StickyNote className="h-6 w-6" />
              {t("noNotes")}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("buttons.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("buttons.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

