import EditorJS, { ToolConstructable } from "@editorjs/editorjs";
import Embed from "@editorjs/embed";
import Table from "@editorjs/table";
import List from "@editorjs/list";
import Warning from "@editorjs/warning";
import Code from "@editorjs/code";
import LinkTool from "@editorjs/link";
import Image from "@editorjs/image";
import Raw from "@editorjs/raw";
import Quote from "@editorjs/quote";
import Marker from "@editorjs/marker";
import CheckList from "@editorjs/checklist";
import Delimiter from "@editorjs/delimiter";
import InlineCode from "@editorjs/inline-code";
import SimpleImage from "@editorjs/simple-image";
import EditorjsColumns from "@calumk/editorjs-columns";
import Paragraph from "@editorjs/paragraph";
import TextAlign from "@canburaks/text-align-editorjs";
import Header from "editorjs-header-with-alignment";

export const editorTools = {
  embed: { class: Embed } as unknown as ToolConstructable,
  table: Table,
  list: List,
  warning: { class: Warning },
  code: { class: Code },
  linkTool: { class: LinkTool },
  image: {
    class: Image,
  },
  raw: { class: Raw },
  header: Header,
  quote: { class: Quote },
  marker: { class: Marker },
  checklist: { class: CheckList },
  delimiter: { class: Delimiter },
  inlineCode: { class: InlineCode },
  simpleImage: { class: SimpleImage },
  textAlign: TextAlign,
  columns: {
    class: EditorjsColumns,
    config: {
      tools: {
        header: Header,
        paragraph: Paragraph,
        list: List,
        image: Image,
        quote: Quote,
        delimiter: Delimiter,
      },
      EditorJsLibrary: EditorJS,
    },
  },
};
