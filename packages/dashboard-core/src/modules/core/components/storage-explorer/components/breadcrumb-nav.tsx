import { DirectoryNodeModel } from "@kitejs/core/index";
import { ChevronRight } from "lucide-react";

interface BreadcrumbNavProps {
  directoryStructure: DirectoryNodeModel | null;
  currentDir: DirectoryNodeModel;
  onNavigate: (dir: DirectoryNodeModel) => void;
}

export function BreadcrumbNav({
  directoryStructure,
  currentDir,
  onNavigate,
}: BreadcrumbNavProps) {
  if (!directoryStructure) {
    return (
      <div className="flex items-center gap-2 px-4 py-2">
        <nav className="flex items-center text-sm animate-pulse">
          {Array(3)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                )}
                <div className="w-16 h-4 bg-gray-200 rounded" />
              </div>
            ))}
        </nav>
      </div>
    );
  }

  const breadcrumbChain = findPathChain(
    directoryStructure,
    currentDir.path
  ) || [directoryStructure];

  function findPathChain(
    root: DirectoryNodeModel,
    targetPath: string
  ): DirectoryNodeModel[] | null {
    if (root.path === targetPath) return [root];
    for (const child of root.children) {
      if (child.type === "directory") {
        const chain = findPathChain(child as DirectoryNodeModel, targetPath);
        if (chain) return [root, ...chain];
      }
    }
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <nav className="flex items-center text-sm">
        {breadcrumbChain.map((node, index) => (
          <div key={node.path} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
            )}
            {index === breadcrumbChain.length - 1 ? (
              <span className="font-medium text-gray-900">
                {index === 0 ? "Home" : node.name}
              </span>
            ) : (
              <button
                onClick={() => onNavigate(node)}
                className="text-gray-600 hover:text-gray-900 hover:underline"
              >
                {index === 0 ? "Home" : node.name}
              </button>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
