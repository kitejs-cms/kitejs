import { useState } from "react";
import { useStorage } from "./use-storage";
import { Sidebar } from "./components/sidebar";
import { FileGrid } from "./components/file-grid";
import { FileList } from "./components/file-list";
import { DialogTitle } from "@radix-ui/react-dialog";
import { BreadcrumbNav } from "./components/breadcrumb-nav";
import { ContextMenu } from "./components/context-menu";
import { RenameDialog } from "./components/rename-dialog";
import { DeleteDialog } from "./components/delete-dialog";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "../../../../components/ui/dialog";
import { NewFolderDialog } from "./components/new-folder-dialog";

export function StorageExplorer() {
  const [open, setOpen] = useState(false);
  const {
    selectedItem,
    currentDir,
    directoryStructure,
    viewMode,
    setViewMode,
    handleItemClick,
    handleItemDoubleClick,
    navigateTo,
    navigateBack,
    navigateForward,
    history,
    openContextMenu,
    closeContextMenu,
    contextMenu,
    modal,
    setModal,
    handleContextMenuAction,
    renameNode,
    deleteNode,
    createNode,
    selectedForCopy,
  } = useStorage();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent position="full" className="p-0">
        <DialogTitle />
        <DialogHeader />
        <div className="flex h-full">
          <Sidebar
            directoryStructure={directoryStructure}
            onViewModeChange={setViewMode}
            viewMode={viewMode}
            history={history}
            currentDir={currentDir}
            onNavigateTo={navigateTo}
            onNavigateBack={navigateBack}
            onNavigateForward={navigateForward}
          />

          <div
            className="flex-1 p-4 overflow-auto relative"
            onClick={() => closeContextMenu()}
            onContextMenu={(e) => {
              if (e.target === e.currentTarget) {
                openContextMenu(e, null, "background");
              }
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <BreadcrumbNav
                directoryStructure={directoryStructure}
                currentDir={currentDir}
                onNavigate={navigateTo}
              />
              <button
                className="p-2 hover:bg-gray-200 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                }}
                title="Chiudi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {viewMode === "grid" ? (
              <FileGrid
                items={currentDir?.children || null}
                selectedItem={selectedItem}
                onItemClick={handleItemClick}
                onItemDoubleClick={handleItemDoubleClick}
                onContextMenu={(e, item) => openContextMenu(e, item, "item")}
              />
            ) : (
              <FileList
                items={currentDir?.children || null}
                selectedItem={selectedItem}
                onItemClick={handleItemClick}
                onItemDoubleClick={handleItemDoubleClick}
                onContextMenu={(e, item) => openContextMenu(e, item, "item")}
              />
            )}

            <ContextMenu
              onClose={closeContextMenu}
              contextMenu={contextMenu}
              onAction={handleContextMenuAction}
              selectedForCopy={selectedForCopy}
            />
          </div>
        </div>

        {/* Dialogs */}
        <RenameDialog
          open={modal.type === "rename"}
          initialName={modal.item?.name || ""}
          onClose={() => setModal({ type: null, item: null })}
          onSubmit={renameNode}
        />
        <DeleteDialog
          open={modal.type === "delete"}
          onClose={() => setModal({ type: null, item: null })}
          onSubmit={deleteNode}
          itemName={modal.item?.name || ""}
        />
        <NewFolderDialog
          open={modal.type === "newfolder"}
          onClose={() => setModal({ type: null, item: null })}
          onSubmit={createNode}
        />
      </DialogContent>
    </Dialog>
  );
}
