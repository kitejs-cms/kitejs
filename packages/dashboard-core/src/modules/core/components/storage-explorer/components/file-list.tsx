import {
  DirectoryNodeModel,
  FileNodeModel,
} from "@kitejs-cms/core/modules/storage/models/fs-node.model";
import { FolderIcon, FileTextIcon } from "lucide-react";

interface FileListProps {
  items: Array<DirectoryNodeModel | FileNodeModel> | null;
  selectedItem: string | null;
  onItemClick: (item: DirectoryNodeModel | FileNodeModel) => void;
  onItemDoubleClick: (item: DirectoryNodeModel | FileNodeModel) => void;
  onContextMenu: (
    e: React.MouseEvent,
    item: DirectoryNodeModel | FileNodeModel
  ) => void;
}

export function FileList({
  items,
  selectedItem,
  onItemClick,
  onItemDoubleClick,
  onContextMenu,
}: FileListProps) {
  if (!items) {
    return (
      <div className="space-y-2 p-4">
        {Array(10)
          .fill(0)
          .map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-3 border rounded-lg animate-pulse"
            >
              <div className="bg-gray-200 w-8 h-8 rounded flex-shrink-0" />
              <div className="bg-gray-200 flex-1 h-4 rounded" />
            </div>
          ))}
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {items.map((item) => (
        <div
          key={item.path}
          className={`flex items-center gap-4 p-3 border rounded-lg hover:shadow cursor-pointer ${
            selectedItem === item.path
              ? "bg-gray-100 border-gray-400"
              : "bg-white"
          }`}
          onClick={() => onItemClick(item)}
          onDoubleClick={() => onItemDoubleClick(item)}
          onContextMenu={(e) => onContextMenu(e, item)}
          title={item.name}
        >
          {item.type === "directory" ? (
            <FolderIcon className="w-8 h-8 text-blue-500 flex-shrink-0" />
          ) : (
            <FileTextIcon className="w-8 h-8 text-gray-500 flex-shrink-0" />
          )}
          <span className="line-clamp-2 break-words flex-1">{item.name}</span>
        </div>
      ))}
    </div>
  );
}
