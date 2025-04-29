import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { XIcon } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { SuggestionMenuController, useCreateBlockNote } from "@blocknote/react";
import { BlockNoteSchema, PartialBlock } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import {
  multiColumnDropCursor,
  locales as multiColumnLocales,
  withMultiColumn,
} from "@blocknote/xl-multi-column";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as locales from "@blocknote/core/locales";
import { useApi } from "../../../hooks/use-api";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  blocks: PartialBlock[];
};

export function PageEditor({ isOpen, onClose, blocks, onSave }: Props) {
  const { t } = useTranslation("pages");
  const { uploadFile } = useApi();

  async function handlerUploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await uploadFile("storage/upload", formData);
    return (data as { url: string }).url;
  }

  const editor = useCreateBlockNote(
    {
      schema: withMultiColumn(BlockNoteSchema.create()),
      initialContent: blocks,
      dropCursor: multiColumnDropCursor,
      dictionary: {
        ...locales.it,
        multi_column: multiColumnLocales["en"],
      },
      uploadFile: handlerUploadFile,
    },
    [blocks]
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        position="full"
        className="p-0 flex flex-col overflow-hidden"
      >
        <div className="flex flex-col h-full">
          {/* Header - Fissato in alto */}
          <DialogHeader className="flex flex-row justify-between items-center p-4 border-b shrink-0">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {t("title.editor")}
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

          {/* Area editor con scroll - Occupa lo spazio rimanente */}
          <ScrollArea className="flex-1 overflow-auto">
            <div className="h-full w-full">
              <div className="flex justify-center h-full min-h-[calc(100dvh-210px)]">
                <div className="w-full max-w-7xl py-4 px-4">
                  <BlockNoteView
                    editor={editor}
                    slashMenu={false}
                    className="h-full"
                  >
                    <SuggestionMenuController triggerCharacter="/" />
                  </BlockNoteView>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Footer - Fissato in basso */}
          <div className="flex justify-end gap-3 p-4 border-t shrink-0">
            <Button variant="outline" onClick={onClose}>
              {t("buttons.cancel")}
            </Button>
            <Button
              onClick={() => {
                onSave();
                onClose();
              }}
            >
              {t("buttons.save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
