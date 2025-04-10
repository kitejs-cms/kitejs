import { Button } from "../../../components/ui/button";
import { ChromePicker, ColorResult } from "react-color";
import { HeadingLevel, HTMLEditorProps } from "../html-editor";
import { HeadingDropdown } from "./heading-dropdown";
import { cn } from "../../../lib/utils";
import { Editor } from "@tiptap/core";
import { useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Palette,
  Quote,
  UnderlineIcon,
} from "lucide-react";

export type ToolbarProps = {
  className?: string;
  editor: Editor;
  enabledFeatures: HTMLEditorProps["enabledFeatures"];
};

export function Toolbar({ editor, enabledFeatures, className }: ToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const currentColor = editor?.getAttributes("textStyle")?.color || "#000000";

  const handleColorChangeComplete = (colorResult: ColorResult) => {
    const colorHex = colorResult.hex;
    editor?.chain().focus().setColor(colorHex).run();
  };

  const handleResetColor = () => {
    editor?.chain().focus().unsetColor().run();
    setShowColorPicker(false);
  };

  const handleHeadingSelect = (level: HeadingLevel) => {
    editor?.chain().focus().toggleHeading({ level }).run();
  };

  const Separator = () => (
    <div className="w-px bg-gray-300 mx-1" style={{ height: "24px" }} />
  );

  return (
    <div
      className={cn(
        "flex flex-wrap gap-1 mb-2 p-2 bg-gray-50 rounded-md border",
        className
      )}
    >
      {enabledFeatures.headings && (
        <>
          <HeadingDropdown
            editor={editor}
            onHeadingSelect={handleHeadingSelect}
          />
          <Separator />
        </>
      )}

      {enabledFeatures.bold && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-gray-200" : ""}
          title="Grassetto"
        >
          <Bold className="h-4 w-4" />
        </Button>
      )}
      {enabledFeatures.italic && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-gray-200" : ""}
          title="Corsivo"
        >
          <Italic className="h-4 w-4" />
        </Button>
      )}
      {enabledFeatures.underline && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive("underline") ? "bg-gray-200" : ""}
          title="Sottolineato"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
      )}
      {enabledFeatures.link && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const previousUrl = editor.getAttributes("link").href;
              const url = window.prompt("Inserisci il URL", previousUrl);
              if (url === null) return;
              if (url === "") {
                editor.chain().focus().unsetLink().run();
              } else {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            className={editor.isActive("link") ? "bg-gray-200" : ""}
            title="Link"
          >
            <Link2 className="h-4 w-4" />
          </Button>
          <Separator />
        </>
      )}

      {enabledFeatures.color && (
        <div className="relative" ref={colorPickerRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowColorPicker((prev) => !prev)}
            className={
              editor.isActive("textStyle", {
                color: /^#(?:[0-9a-f]{3}){1,2}$/i,
              })
                ? "bg-gray-200"
                : ""
            }
            title="Colore testo"
          >
            <Palette className="h-4 w-4" />
          </Button>
          {showColorPicker && (
            <div className="absolute z-50 left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
              <ChromePicker
                styles={{
                  default: { picker: { boxShadow: "none" } },
                }}
                color={currentColor}
                onChangeComplete={handleColorChangeComplete}
              />
              <div className="p-2 border-t border-gray-200 flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetColor}
                  className="text-xs h-8 px-2"
                >
                  Reset
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowColorPicker(false)}
                  className="text-xs h-8 px-2"
                >
                  Chiudi
                </Button>
              </div>
            </div>
          )}
          <Separator />
        </div>
      )}

      {enabledFeatures.align && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={
              editor.isActive({ textAlign: "left" }) ? "bg-gray-200" : ""
            }
            title="Allinea a sinistra"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={
              editor.isActive({ textAlign: "center" }) ? "bg-gray-200" : ""
            }
            title="Allinea al centro"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={
              editor.isActive({ textAlign: "right" }) ? "bg-gray-200" : ""
            }
            title="Allinea a destra"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Separator />
        </>
      )}

      {enabledFeatures.lists && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? "bg-gray-200" : ""}
            title="Lista puntata"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive("orderedList") ? "bg-gray-200" : ""}
            title="Lista numerata"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Separator />
        </>
      )}

      {enabledFeatures.blockquote && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive("blockquote") ? "bg-gray-200" : ""}
          title="Citazione"
        >
          <Quote className="h-4 w-4" />
        </Button>
      )}

      {enabledFeatures.codeBlock && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive("codeBlock") ? "bg-gray-200" : ""}
          title="Blocco di codice"
        >
          <Code className="h-4 w-4" />
        </Button>
      )}
      {enabledFeatures.horizontalRule && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Linea divisoria"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Separator />
        </>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          editor.chain().focus().unsetAllMarks().clearNodes().run()
        }
        title="Reset formato"
      >
        <span className="font-light text-lg line-through">T</span>
      </Button>
    </div>
  );
}
