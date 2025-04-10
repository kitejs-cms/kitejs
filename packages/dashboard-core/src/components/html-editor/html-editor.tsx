import React, { Ref, useEffect } from "react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import BulletList from "@tiptap/extension-bullet-list";
import Blockquote from "@tiptap/extension-blockquote";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import CodeBlock from "@tiptap/extension-code-block";
import { Toolbar } from "./components/toolbar";
import { cn } from "../../lib/utils";
import {
  useEditor,
  EditorContent,
  BubbleMenu,
  EditorContentProps,
} from "@tiptap/react";

export type HeadingLevel = 1 | 2 | 3;

export interface HTMLEditorProps
  extends Omit<EditorContentProps, "onChange" | "editor"> {
  content: string;
  onChange: (content: string) => void;
  mode?: "classic" | "modern";
  enabledFeatures?: {
    headings?: boolean;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    link?: boolean;
    color?: boolean;
    align?: boolean;
    lists?: boolean;
    blockquote?: boolean;
    code?: boolean;
    codeBlock?: boolean;
    horizontalRule?: boolean;
  };
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

export const HTMLEditor: React.FC<HTMLEditorProps> = ({
  content,
  onChange,
  mode = "modern",
  enabledFeatures = {
    headings: true,
    bold: true,
    italic: true,
    underline: true,
    link: true,
    color: true,
    align: true,
    lists: true,
    blockquote: true,
    code: true,
    codeBlock: true,
    horizontalRule: true,
  },
  className = "",
  ref,
  ...editorProps
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      TextStyle,
      Color.configure({ types: [TextStyle.name] }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ListItem.configure({
        HTMLAttributes: { class: "my-1" },
      }),
      BulletList.configure({
        HTMLAttributes: { class: "list-disc pl-4 my-2" },
      }),
      OrderedList.configure({
        HTMLAttributes: { class: "list-decimal pl-4 my-2" },
      }),
      Blockquote.configure({
        HTMLAttributes: {
          class: "border-l-4 border-gray-300 pl-4 italic my-4",
        },
      }),
      HorizontalRule.configure({
        HTMLAttributes: { class: "my-4 border-t border-gray-300" },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: "rounded-md bg-gray-50 p-4 my-4 font-mono text-sm",
        },
      }),
    ],
    autofocus: "end",
    content: content || "<p></p>",
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) return null;

  const containerClasses = cn("relative", className);

  const editorContentClasses = cn(
    "outline-none [&_.ProseMirror]:outline-none",
    mode === "modern"
      ? "outline-none [&_.ProseMirror]:outline-none"
      : "border border-gray-300 rounded-md hover:border-gray-500 min-h-[300px] p-4 "
  );

  const renderClassicEditor = () => (
    <div
      className={containerClasses}
      onClick={() => editor.chain().focus().run()}
    >
      <Toolbar editor={editor} enabledFeatures={enabledFeatures} />
      <EditorContent editor={editor} className={editorContentClasses} />
    </div>
  );

  const renderModernEditor = () => (
    <div ref={ref} className={containerClasses}>
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 100, placement: "top", arrow: true }}
        shouldShow={({ editor, from, to }) =>
          from !== to && !editor.isActive("codeBlock")
        }
      >
        <Toolbar editor={editor} enabledFeatures={enabledFeatures} />
      </BubbleMenu>
      <EditorContent
        className={editorContentClasses}
        {...editorProps}
        editor={editor}
      />
    </div>
  );

  return mode === "classic" ? renderClassicEditor() : renderModernEditor();
};
