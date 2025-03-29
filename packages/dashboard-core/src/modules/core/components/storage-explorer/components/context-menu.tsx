import {
  DirectoryNodeModel,
  FileNodeModel,
} from "@kitejs/core/modules/storage/models/fs-node.model";
import {
  FolderPlus,
  Upload,
  ClipboardPaste,
  Edit,
  FolderOpen,
  Trash,
  Scissors,
} from "lucide-react";

export interface ContextMenuProps {
  selectedForCopy: DirectoryNodeModel | FileNodeModel | null;
  contextMenu: {
    x: number;
    y: number;
    item: DirectoryNodeModel | FileNodeModel | null;
    type: "item" | "background";
    dialog?: {
      type: "rename" | "delete" | "move" | "newfolder";
      inputValue: string;
    };
  } | null;
  onAction: (
    action:
      | "open"
      | "rename"
      | "delete"
      | "move"
      | "newfolder"
      | "upload"
      | "paste",
    item?: DirectoryNodeModel | FileNodeModel
  ) => void;
  onClose: () => void;
}

export function ContextMenu({
  contextMenu,
  onAction,
  onClose,
  selectedForCopy,
}: ContextMenuProps) {
  if (!contextMenu || !contextMenu.type) return null;

  return (
    <div
      className="fixed bg-white border shadow-md rounded p-2 z-50 w-48 context-menu"
      style={{
        left: `${contextMenu.x}px`,
        top: `${contextMenu.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {contextMenu.type === "item" ? (
        <>
          <MenuItem
            icon={<FolderOpen className="w-4 h-4" />}
            label="Open"
            onClick={() => {
              onAction("open", contextMenu.item!);
              onClose();
            }}
          />

          <MenuItem
            icon={<Edit className="w-4 h-4" />}
            label="Rename"
            onClick={() => {
              onAction("rename", contextMenu.item!);
              onClose();
            }}
          />
          <MenuItem
            icon={<Trash className="w-4 h-4" />}
            label="Delete"
            onClick={() => {
              onAction("delete", contextMenu.item!);
              onClose();
            }}
          />
          <MenuItem
            icon={<Scissors className="w-4 h-4" />}
            label="Cut"
            onClick={() => {
              onAction("move", contextMenu.item!);
              onClose();
            }}
          />
        </>
      ) : (
        <>
          <MenuItem
            icon={<FolderPlus className="w-4 h-4" />}
            label="New Folder"
            onClick={() => {
              onAction("newfolder");
              onClose();
            }}
          />
          <MenuItem
            icon={<Upload className="w-4 h-4" />}
            label="Upload"
            onClick={() => {
              onAction("upload");
              onClose();
            }}
          />
          <MenuItem
            icon={<ClipboardPaste className="w-4 h-4" />}
            label="Paste"
            disabled={!selectedForCopy}
            onClick={() => {
              if (!selectedForCopy) return;
              onAction("paste");
              onClose();
            }}
          />
        </>
      )}
    </div>
  );
}

export function MenuItem({
  icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`p-2 rounded flex items-center gap-2 ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:bg-gray-100"
      }`}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
