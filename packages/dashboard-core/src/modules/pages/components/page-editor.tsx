import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { XIcon } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import {
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import {
  BlockNoteSchema,
  combineByGroup,
  filterSuggestionItems,
  PartialBlock,
} from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useApi } from "../../../hooks/use-api";
import {
  getMultiColumnSlashMenuItems,
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
import type { PageBlockModel } from "@kitejs-cms/core/index";
import { useEffect, useMemo, useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (block: PageBlockModel[]) => void;
  blocks: PageBlockModel[];
  activeLang: string;
};

export function PageEditor({
  isOpen,
  onClose,
  blocks,
  onSave,
  activeLang,
}: Props) {
  const { t } = useTranslation("pages");
  const { uploadFile } = useApi();

  const [internalBlocks, setInternalBlocks] = useState<
    PartialBlock[] | undefined
  >(undefined);

  async function handlerUploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await uploadFile("storage/upload", formData);
    return (data as { url: string }).url;
  }

  useEffect(() => {
    if (blocks !== undefined && blocks.length > 0) {
      setInternalBlocks(undefined);

      setTimeout(() => {
        setInternalBlocks(blocks as PartialBlock[]);
      }, 0);
    } else {
      setInternalBlocks(undefined);
    }
  }, [blocks, activeLang]);

  const editor = useCreateBlockNote(
    {
      schema: withMultiColumn(BlockNoteSchema.create()),
      dropCursor: multiColumnDropCursor,
      initialContent: internalBlocks,
      dictionary: {
        ...locales.it,
        multi_column: multiColumnLocales["en"],
      },
      uploadFile: handlerUploadFile,
    },
    [internalBlocks, activeLang]
  );

  const getSlashMenuItems = useMemo(() => {
    return async (query: string) =>
      filterSuggestionItems(
        combineByGroup(
          getDefaultReactSlashMenuItems(editor),
          getMultiColumnSlashMenuItems(editor)
        ),
        query
      );
  }, [editor]);

  const onCloseHandler = () => {
    onClose();
  };

  const onSaveHandler = () => {
    onClose();
    onSave(editor.document as []);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCloseHandler()}>
      <DialogContent
        position="full"
        className="p-0 flex flex-col overflow-hidden"
      >
        <div className="flex flex-col h-full">
          <DialogHeader className="flex flex-row justify-between items-center p-4 border-b shrink-0">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {t("title.editor")}
            </DialogTitle>
            <DialogClose asChild>
              <div className="flex items-center gap-2 text-gray-500 hover:text-tesrblack transition cursor-pointer">
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

          <ScrollArea className="flex-1 overflow-auto">
            <div className="h-full w-full">
              <div className="flex justify-center h-full min-h-[calc(100dvh-210px)]">
                <div className="w-full max-w-7xl py-4 px-4">
                  {editor && (
                    <BlockNoteView
                      editor={editor}
                      slashMenu={false}
                      className="h-full"
                    >
                      <SuggestionMenuController
                        triggerCharacter="/"
                        getItems={getSlashMenuItems}
                      />
                    </BlockNoteView>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-3 p-4 border-t shrink-0">
            <Button variant="outline" onClick={onCloseHandler}>
              {t("buttons.cancel")}
            </Button>
            <Button onClick={onSaveHandler}>{t("buttons.save")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
