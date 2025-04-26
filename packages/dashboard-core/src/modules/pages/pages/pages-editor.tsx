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

export function PagesEditor() {
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
    <BlockNoteView editor={editor} slashMenu={false}>
      <SuggestionMenuController triggerCharacter={"/"} />
    </BlockNoteView>
  );
}
