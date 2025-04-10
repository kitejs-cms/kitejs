import { ChevronDown, Heading1, Heading2, Heading3, Type } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { HeadingLevel } from "../html-editor";
import { Editor } from "@tiptap/core";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";

interface HeadingDropdownProps {
  editor: Editor;
  onHeadingSelect: (level: HeadingLevel) => void;
}

export function HeadingDropdown({
  editor,
  onHeadingSelect,
}: HeadingDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <Type className="h-4 w-4" />
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white border rounded-md shadow-lg p-1">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => onHeadingSelect(1)}>
            <Heading1 className="h-4 w-4 mr-2" />
            Intestazione 1
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onHeadingSelect(2)}>
            <Heading2 className="h-4 w-4 mr-2" />
            Intestazione 2
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onHeadingSelect(3)}>
            <Heading3 className="h-4 w-4 mr-2" />
            Intestazione 3
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            editor.chain().focus().setParagraph().run();
          }}
        >
          Paragrafo normale
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
