import { useEffect } from "react";
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
  };

  return (
    <div className="space-y-4">
      {canAddNote && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">{t("fields.notes")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="min-h-[80px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm">
                {t("buttons.addNote")}
              </Button>
            </div>
          </form>
        </Form>
      )}

      <div className="space-y-2">
        {notes?.length ? (
          notes.map((note) => (
            <div
              key={note.id}
              className="border rounded p-3 text-sm bg-white"
            >
              <p>{note.content}</p>
              <div className="text-xs text-gray-500 pt-1">
                {t("fields.source")}: {note.source} - {" "}
                {new Date(note.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">{t("empty")}</p>
        )}
      </div>
    </div>
  );
}
