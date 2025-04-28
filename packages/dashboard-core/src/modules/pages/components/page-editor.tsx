import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { XIcon } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { SuggestionMenuController, useCreateBlockNote } from "@blocknote/react";
import { BlockNoteSchema } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import {
  multiColumnDropCursor,
  locales as multiColumnLocales,
  withMultiColumn,
} from "@blocknote/xl-multi-column";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as locales from "@blocknote/core/locales";
import { useApi } from "../../../hooks/use-api";

type Props = { isOpen: boolean; onClose: () => void };

export function PageEditor({ isOpen, onClose }: Props) {
  const { t } = useTranslation();

  const { uploadFile } = useApi();

  async function handlerUploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await uploadFile("storage/upload", formData);
    console.log(data);

    return (data as { url: string }).url;
  }

  const editor = useCreateBlockNote({
    schema: withMultiColumn(BlockNoteSchema.create()),
    dropCursor: multiColumnDropCursor,
    dictionary: {
      ...locales.it,
      multi_column: multiColumnLocales["en"],
    },
    uploadFile: handlerUploadFile,
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="fixed inset-0 w-screen h-screen max-w-none max-h-none p-0 bg-white"
        onInteractOutside={(e) => e.preventDefault()} // Previene la chiusura cliccando fuori
      >
        <div>
          {/* Header */}
          <DialogHeader className="flex flex-row justify-between items-center p-4 border-b">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {t("json-modal.title")}
            </DialogTitle>
            <DialogClose asChild>
              <div className="flex items-center gap-2 text-gray-500 hover:text-black transition cursor-pointer">
                <Badge
                  variant="outline"
                  className="bg-gray-100 text-gray-400 border-gray-400 font-medium px-2 py-0.5"
                >
                  Esc
                </Badge>
                <XIcon className="w-5 h-5" />
              </div>
            </DialogClose>
          </DialogHeader>

          {/* Editor - Area principale a schermo intero */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full w-full">
              <BlockNoteView
                editor={editor}
                slashMenu={false}
                className="h-full min-h-[calc(100vh-120px)]" // Altezza dinamica
                theme="light"
              >
                <SuggestionMenuController triggerCharacter="/" />
              </BlockNoteView>
            </ScrollArea>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t">
            <Button variant="outline" onClick={onClose}>
              {t("buttons.cancel")}
            </Button>
            <Button onClick={() => null}>{t("buttons.save")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
