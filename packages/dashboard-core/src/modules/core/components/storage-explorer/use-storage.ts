import { useEffect, useState } from "react";
import { useApi } from "../../../../hooks/use-api";
import type {
  DirectoryNodeModel,
  FileNodeModel,
} from "@kitejs/core/modules/storage/models/fs-node.model";

export type ViewMode = "grid" | "list";

export type ModalType =
  | "rename"
  | "delete"
  | "newfolder"
  | "move"
  | "upload"
  | null;

export interface ModalState {
  type: ModalType;
  item?: DirectoryNodeModel | FileNodeModel;
}

export function useStorage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentDir, setCurrentDir] = useState<DirectoryNodeModel | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedForCopy, setSelectedForCopy] = useState<
    DirectoryNodeModel | FileNodeModel | null
  >(null);
  const [directoryStructure, setDirectoryStructure] =
    useState<DirectoryNodeModel | null>(null);

  const [history, setHistory] = useState<{
    back: DirectoryNodeModel[];
    forward: DirectoryNodeModel[];
  }>({
    back: [],
    forward: [],
  });

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: DirectoryNodeModel | FileNodeModel | null;
    type: "item" | "background";
    timestamp: number;
  } | null>(null);

  const [modal, setModal] = useState<ModalState>({ type: null });
  const { fetchData, loading } = useApi();

  const findNodeByPath = (
    node: DirectoryNodeModel,
    targetPath: string
  ): DirectoryNodeModel | null => {
    if (node.path === targetPath) {
      return node;
    }
    for (const child of node.children) {
      if (child.type === "directory") {
        const found = findNodeByPath(child as DirectoryNodeModel, targetPath);
        if (found) return found;
      }
    }
    return null;
  };

  const getDirectoryStructure = async () => {
    try {
      const { data } = await fetchData("storage/directory");
      if (data) {
        const root = data as DirectoryNodeModel;
        setDirectoryStructure(root);
        if (currentDir) {
          const updatedCurrent = findNodeByPath(root, currentDir.path);
          setCurrentDir(updatedCurrent ? updatedCurrent : root);
        } else {
          setCurrentDir(root);
        }
      }
    } catch (error) {
      console.error("Failed to load directory structure:", error);
    }
  };

  useEffect(() => {
    getDirectoryStructure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);

  const handleItemClick = (item: DirectoryNodeModel | FileNodeModel) => {
    setSelectedItem(item.path);
    closeContextMenu();
    console.log("Elemento selezionato:", item);
  };

  const handleItemDoubleClick = (item: DirectoryNodeModel | FileNodeModel) => {
    closeContextMenu();
    if (item.type === "directory") {
      if (currentDir) {
        setHistory((prev) => ({
          back: [...prev.back, currentDir],
          forward: [],
        }));
      }
      setCurrentDir(item as DirectoryNodeModel);
      setSelectedItem(null);
      console.log("Naviga a directory:", item);
    } else {
      console.log("Apri file:", item);
    }
  };

  const navigateTo = (dir: DirectoryNodeModel) => {
    closeContextMenu();
    if (currentDir) {
      setHistory((prev) => ({
        back: [...prev.back, currentDir],
        forward: [],
      }));
    }
    setCurrentDir(dir);
    setSelectedItem(null);
    console.log("Navigated to:", dir);
  };

  const navigateBack = () => {
    closeContextMenu();
    if (history.back.length > 0) {
      const previousDir = history.back[history.back.length - 1];
      setHistory((prev) => ({
        back: prev.back.slice(0, -1),
        forward: [currentDir!, ...prev.forward],
      }));
      setCurrentDir(previousDir);
      setSelectedItem(null);
      console.log("Navigated back to:", previousDir);
    }
  };

  const navigateForward = () => {
    closeContextMenu();
    if (history.forward.length > 0) {
      const nextDir = history.forward[0];
      setHistory((prev) => ({
        back: [...prev.back, currentDir!],
        forward: prev.forward.slice(1),
      }));
      setCurrentDir(nextDir);
      setSelectedItem(null);
      console.log("Navigated forward to:", nextDir);
    }
  };

  const openContextMenu = (
    e: React.MouseEvent,
    item: DirectoryNodeModel | FileNodeModel | null,
    type: "item" | "background"
  ) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
      type,
      timestamp: Date.now(),
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleContextMenuAction = (
    action:
      | "open"
      | "rename"
      | "delete"
      | "move"
      | "newfolder"
      | "upload"
      | "paste",
    item?: DirectoryNodeModel | FileNodeModel
  ) => {
    closeContextMenu();

    switch (action) {
      case "rename":
      case "delete":
      case "newfolder":
      case "upload":
        setModal({ type: action, item });
        break;
      case "open":
        if (item) {
          if (item.type === "directory") {
            navigateTo(item as DirectoryNodeModel);
          } else {
            console.log("Apri file:", item);
          }
        }
        break;
      case "move":
        setSelectedForCopy(item);
        break;
      case "paste":
        moveNode();
        break;
    }
  };

  const renameNode = async (newPath: string) => {
    await fetchData("storage/rename", "POST", {
      oldPath: modal.item.path,
      newPath: modal.item.path.replace(modal.item.name, newPath),
    });

    await getDirectoryStructure();
    setModal({ item: null, type: null });
  };

  const deleteNode = async () => {
    await fetchData("storage/remove", "DELETE", {
      filePath: modal.item.path,
    });

    await getDirectoryStructure();
    setModal({ item: null, type: null });
  };

  const createNode = async (folderName: string) => {
    const directoryPath =
      currentDir.path === "/"
        ? `/${folderName}`
        : `${currentDir.path}/${folderName}`;

    await fetchData("storage/directory", "POST", { directoryPath });

    await getDirectoryStructure();
    setModal({ item: null, type: null });
  };

  const moveNode = async () => {
    if (!directoryStructure) return;
    try {
      const destinationPath =
        selectedForCopy.path === "/"
          ? `/${selectedForCopy.name}`
          : `${currentDir.path}/${selectedForCopy.name}`;

      await fetchData("storage/move", "POST", {
        sourcePath: selectedForCopy.path,
        destinationPath,
      });
      await getDirectoryStructure();
      setModal({ type: null, item: null });
      setSelectedForCopy(null);
    } catch (error) {
      console.error("Error moving item:", error);
    }
  };

  return {
    selectedItem,
    setSelectedItem,
    directoryStructure,
    loading,
    viewMode,
    setViewMode,
    currentDir,
    setCurrentDir,
    history,
    navigateTo,
    navigateBack,
    navigateForward,
    handleItemClick,
    handleItemDoubleClick,
    contextMenu,
    openContextMenu,
    closeContextMenu,
    modal,
    setModal,
    handleContextMenuAction,
    renameNode,
    deleteNode,
    createNode,
    selectedForCopy,
  };
}
