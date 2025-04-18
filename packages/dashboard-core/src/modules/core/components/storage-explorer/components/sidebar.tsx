import { DirectoryNodeModel } from "@kitejs-cms/core/modules/storage/models/fs-node.model";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  FolderIcon,
} from "lucide-react";

interface SidebarProps {
  directoryStructure: DirectoryNodeModel | null;
  currentDir: DirectoryNodeModel | null;
  viewMode: "grid" | "list";
  history: {
    back: DirectoryNodeModel[];
    forward: DirectoryNodeModel[];
  };
  onNavigateTo: (dir: DirectoryNodeModel) => void;
  onNavigateBack: () => void;
  onNavigateForward: () => void;
  onViewModeChange: (mode: "grid" | "list") => void;
}

export function Sidebar({
  directoryStructure,
  currentDir,
  viewMode,
  history,
  onNavigateTo,
  onNavigateBack,
  onNavigateForward,
  onViewModeChange,
}: SidebarProps) {
  if (!directoryStructure || !currentDir) {
    return (
      <div className="w-64 bg-neutral-50 p-4 flex flex-col rounded-md animate-pulse pt-6">
        <div className="h-8 bg-gray-200 rounded-md mb-6" />
        <div className="h-6 bg-gray-200 rounded-md mb-2" />
        <div className="h-6 bg-gray-200 rounded-md mb-2" />
        <div className="h-6 bg-gray-200 rounded-md mb-2" />
        <div className="h-6 bg-gray-200 rounded-md mb-2" />
      </div>
    );
  }

  const rootDirectories = directoryStructure.children.filter(
    (item) => item.type === "directory"
  ) as DirectoryNodeModel[];

  const isActive = (dir: DirectoryNodeModel) => currentDir.path === dir.path;

  return (
    <div className="w-64 bg-neutral-50 p-4 flex flex-col rounded-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateBack}
            disabled={history.back.length === 0}
            className={`p-2 rounded ${
              history.back.length === 0
                ? "text-gray-400"
                : "text-gray-700 hover:bg-gray-200"
            }`}
            title="Back"
          >
            <ChevronLeft className="scale-90" />
          </button>
          <button
            onClick={onNavigateForward}
            disabled={history.forward.length === 0}
            className={`p-1 rounded ${
              history.forward.length === 0
                ? "text-gray-400"
                : "text-gray-700 hover:bg-gray-200"
            }`}
            title="Forward"
          >
            <ChevronRight className="scale-90" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-1 rounded ${
              viewMode === "grid" ? "bg-gray-200" : "hover:bg-gray-200"
            }`}
            title="Grid View"
          >
            <LayoutGrid className="scale-75" />
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`p-1 rounded ${
              viewMode === "list" ? "bg-gray-200" : "hover:bg-gray-200"
            }`}
            title="List View"
          >
            <List className="scale-75" />
          </button>
        </div>
      </div>
      <button
        onClick={() => onNavigateTo(directoryStructure)}
        className={`w-full text-left mb-2 p-2 rounded flex items-center ${
          currentDir.path === directoryStructure.path
            ? "bg-gray-200 font-medium"
            : "hover:bg-gray-100"
        }`}
      >
        <FolderIcon className="w-4 h-4 mr-2 text-gray-500" />
        <span>Home</span>
      </button>
      <div className="flex flex-col gap-1 overflow-y-auto">
        {rootDirectories.map((dir) => (
          <button
            key={dir.path}
            onClick={() => onNavigateTo(dir)}
            className={`w-full text-left p-2 rounded flex items-center ${
              isActive(dir) ? "bg-gray-200 font-medium" : "hover:bg-gray-100"
            }`}
          >
            <FolderIcon className="w-4 h-4 mr-2 text-gray-500" />
            <span className="truncate">{dir.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
