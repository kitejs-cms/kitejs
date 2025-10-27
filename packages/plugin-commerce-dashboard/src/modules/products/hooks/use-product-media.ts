import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IdGenerator, useApi } from "@kitejs-cms/dashboard-core";
import { getTypeFromFile, getTypeFromUrl } from "../helpers";

type MediaStatus = "idle" | "uploading" | "error";
type MediaType = "image" | "video" | "file";

export const ACCEPTED_TYPES = "image/*,video/*";
const UPLOAD_DIR = "commerce/products";

export interface MediaItem {
  id: string;
  name: string;
  url: string | null;
  previewUrl: string;
  previewIsObject: boolean;
  status: MediaStatus;
  type: MediaType;
}

export interface UseProductMediaManagerOptions {
  open: boolean;
  gallery: string[];
  thumbnail?: string;
  onConfirm: (payload: {
    gallery: string[];
    thumbnail: string;
  }) => Promise<void> | void;
}

export function useProductMediaManager({
  gallery,
  onConfirm,
}: UseProductMediaManagerOptions) {
  const [mediaItems, setMediaItems] = useState<string[]>(gallery);
  const [selectedDefault, setSelectedDefault] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPersisting, setIsPersisting] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);

  const { uploadFile } = useApi();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 💡 Derived states
  const hasReadyItems = useMemo(() => false, []);
  const hasPendingUploads = useMemo(() => false, []);
  const isBusy = isConfirming || isPersisting;

  // 📂 Handler upload
  const handleFileInput = useCallback(
    async (files: FileList | File[]) => {
      const queue = Array.from(files);
      if (!queue.length) return;

      const newItems: MediaItem[] = queue.map((file) => ({
        id: IdGenerator.nanoid(),
        name: file.name,
        url: null,
        previewUrl: URL.createObjectURL(file),
        previewIsObject: true,
        status: "uploading",
        type: getTypeFromFile(file),
      }));

      await Promise.all(
        newItems.map(async (item, index) => {
          const file = queue[index];
          const form = new FormData();
          form.append("file", file);
          form.append("dir", UPLOAD_DIR);

          try {
            const { data } = await uploadFile("storage/upload", form);
            const url = (data as { url: string }).url;
            setMediaItems([...mediaItems, url]);
            // Se non c’è un default, il primo upload diventa predefinito
            setSelectedDefault((cur) => cur ?? url);
          } catch {
            setHasErrors(true);
          }
        })
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uploadFile]
  );

  // 🗑️ Handler rimozione media
  const handleRemove = useCallback((id: string) => {
    // tua logica qui
  }, []);

  // ⭐ Handler per settare il default
  const handleSetDefault = useCallback((url: string) => {
    // tua logica qui
  }, []);

  // ✅ Conferma manuale
  const handleConfirm = useCallback(async () => {
    // tua logica qui
  }, [onConfirm]);

  return {
    fileInputRef,
    mediaItems,
    selectedDefault,
    hasReadyItems,
    hasPendingUploads,
    hasErrors,
    isBusy,
    isConfirming,
    isPersisting,
    ACCEPTED_TYPES,
    // handlers
    handleFileInput,
    handleRemove,
    handleSetDefault,
    handleConfirm,
    setMediaItems,
    setSelectedDefault,
    setIsConfirming,
    setIsPersisting,
    setHasErrors,
  };
}
