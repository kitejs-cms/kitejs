import {
  DirectoryNodeModel,
  FileNodeModel,
} from "@kitejs-cms/core/modules/storage/models/fs-node.model";
import { FileTextIcon, FolderIcon } from "lucide-react";

interface FileGridProps {
  items: Array<DirectoryNodeModel | FileNodeModel> | null;
  selectedItem: string | null;
  onItemClick: (item: DirectoryNodeModel | FileNodeModel) => void;
  onItemDoubleClick: (item: DirectoryNodeModel | FileNodeModel) => void;
  onContextMenu: (
    e: React.MouseEvent,
    item: DirectoryNodeModel | FileNodeModel
  ) => void;
}

export function FileGrid({
  items,
  selectedItem,
  onItemClick,
  onItemDoubleClick,
  onContextMenu,
}: FileGridProps) {
  if (!items) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
        {Array(10)
          .fill(0)
          .map((_, index) => (
            <div
              key={index}
              className="animate-pulse border p-3 rounded-lg flex flex-col items-center justify-center w-full aspect-square max-w-[180px]"
            >
              <div className="bg-gray-200 w-12 h-12 mb-3 rounded" />
              <div className="bg-gray-200 w-full h-4 rounded" />
            </div>
          ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
      {items.map((item) => (
        <div
          key={item.path}
          className={`border p-3 rounded-lg flex flex-col items-center justify-center hover:shadow-md cursor-pointer w-full aspect-square max-w-[180px] ${
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
            <FolderIcon className="w-12 h-12 text-blue-500 mb-3" />
          ) : (
            <FileTextIcon className="w-12 h-12 text-gray-500 mb-3" />
          )}
          <span className="text-sm text-center line-clamp-2 break-words w-full px-1">
            {item.name}
          </span>
        </div>
      ))}
    </div>
  );
}
