import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApi } from "@kitejs-cms/dashboard-core";

type MediaStatus = "idle" | "uploading" | "error";
type MediaType = "image" | "video" | "file";

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
  onPersist: (payload: {
    gallery: string[];
    thumbnail: string;
  }) => Promise<void> | void;
}

export const ACCEPTED_TYPES = "image/*,video/*";
const UPLOAD_DIR = "commerce/products";

const createId = () =>
  typeof globalThis.crypto !== "undefined" &&
  typeof globalThis.crypto.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const getTypeFromFile = (file: File): MediaType => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "file";
};

const getTypeFromUrl = (url: string): MediaType => {
  const ext = url.split("?")[0]?.split("#")[0]?.split(".").pop()?.toLowerCase();
  if (!ext) return "file";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "avif"].includes(ext))
    return "image";
  if (["mp4", "webm", "ogg", "mov", "m4v"].includes(ext)) return "video";
  return "file";
};

const getNameFromUrl = (url: string) => {
  try {
    const parts = url.split("/");
    return decodeURIComponent(parts[parts.length - 1] || url);
  } catch {
    return url;
  }
};

export function useProductMediaManager({
  open,
  gallery,
  thumbnail,
  onConfirm,
  onPersist,
}: UseProductMediaManagerOptions) {
  const { uploadFile } = useApi();

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedDefault, setSelectedDefault] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPersisting, setIsPersisting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist control refs
  const skipInitialRef = useRef(true);
  const lastStateRef = useRef<{
    galleryKey: string;
    thumbnail: string | null;
  } | null>(null);
  const inFlightRef = useRef(false);

  // Derived states
  const hasReadyItems = useMemo(
    () => mediaItems.some((i) => i.url),
    [mediaItems]
  );
  const hasPendingUploads = useMemo(
    () => mediaItems.some((i) => i.status === "uploading" || !i.url),
    [mediaItems]
  );
  const hasErrors = useMemo(
    () => mediaItems.some((i) => i.status === "error"),
    [mediaItems]
  );

  const readyGallery = useMemo(
    () => mediaItems.filter((i) => i.url).map((i) => i.url as string),
    [mediaItems]
  );

  const uniqueGallery = useMemo(
    () => readyGallery.filter((u, i) => readyGallery.indexOf(u) === i),
    [readyGallery]
  );

  const isBusy = hasPendingUploads || isPersisting;

  // Reset & seed on modal open/close
  useEffect(() => {
    if (!open) {
      mediaItems.forEach(
        (i) => i.previewIsObject && URL.revokeObjectURL(i.previewUrl)
      );
      setMediaItems([]);
      setSelectedDefault(null);
      setDragOver(false);
      // reset persist guards
      skipInitialRef.current = true;
      lastStateRef.current = null;
      inFlightRef.current = false;
      setIsPersisting(false);
      return;
    }

    const combined = Array.from(
      new Set(
        [...(gallery ?? []), thumbnail].filter((v): v is string =>
          Boolean(v && v.trim())
        )
      )
    );

    const seeded = combined.map((url) => ({
      id: createId(),
      name: getNameFromUrl(url),
      url,
      previewUrl: url,
      previewIsObject: false,
      status: "idle" as MediaStatus,
      type: getTypeFromUrl(url),
    }));

    setMediaItems(seeded);
    setSelectedDefault(
      thumbnail && combined.includes(thumbnail)
        ? thumbnail
        : (seeded[0]?.url ?? null)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, gallery, thumbnail]);

  // Auto-correct default if rimosso
  useEffect(() => {
    if (!selectedDefault) {
      const first = mediaItems.find((i) => i.url);
      if (first) setSelectedDefault(first.url);
      return;
    }
    const exists = mediaItems.some((i) => i.url === selectedDefault);
    if (!exists) {
      const fallback = mediaItems.find((i) => i.url);
      setSelectedDefault(fallback?.url ?? null);
    }
  }, [mediaItems, selectedDefault]);

  // Upload multiplo
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const queue = Array.from(files);
      if (!queue.length) return;

      const newItems: MediaItem[] = queue.map((file) => ({
        id: createId(),
        name: file.name,
        url: null,
        previewUrl: URL.createObjectURL(file),
        previewIsObject: true,
        status: "uploading",
        type: getTypeFromFile(file),
      }));

      setMediaItems((prev) => [...prev, ...newItems]);

      await Promise.all(
        newItems.map(async (item, index) => {
          const file = queue[index];
          const form = new FormData();
          form.append("file", file);
          form.append("dir", UPLOAD_DIR);

          try {
            const { data } = await uploadFile("storage/upload", form);
            const url = (data as { url: string }).url;
            URL.revokeObjectURL(item.previewUrl);
            setMediaItems((prev) =>
              prev.map((i) =>
                i.id === item.id
                  ? {
                      ...i,
                      url,
                      previewUrl: url,
                      previewIsObject: false,
                      status: "idle",
                      type: getTypeFromUrl(url),
                    }
                  : i
              )
            );
            // Se non c'è un default, il primo upload diventa predefinito
            setSelectedDefault((cur) => cur ?? url);
          } catch {
            setMediaItems((prev) =>
              prev.map((i) =>
                i.id === item.id ? { ...i, status: "error" } : i
              )
            );
          }
        })
      );
    },
    [uploadFile]
  );

  // Drag & drop
  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (isBusy) return;
      if (e.dataTransfer.files?.length) await handleFiles(e.dataTransfer.files);
    },
    [handleFiles, isBusy]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isBusy || !e.target.files?.length) return;
      await handleFiles(e.target.files);
      e.target.value = "";
    },
    [handleFiles, isBusy]
  );

  const handleRemove = useCallback(
    (id: string) => {
      setMediaItems((prev) => {
        const target = prev.find((i) => i.id === id);
        if (target?.previewIsObject) URL.revokeObjectURL(target.previewUrl);

        const updated = prev.filter((i) => i.id !== id);

        // Aggiorna il default se necessario
        if (target?.url && selectedDefault === target.url) {
          const fallback = updated.find((i) => i.url);
          setSelectedDefault(fallback?.url ?? null);
        }

        // 🧠 Evita che il persist entri in loop dopo la rimozione
        const newGallery = updated
          .filter((i) => i.url)
          .map((i) => i.url as string)
          .filter((u, i, arr) => arr.indexOf(u) === i);

        const newGalleryKey = JSON.stringify(newGallery);
        lastStateRef.current = {
          galleryKey: newGalleryKey,
          thumbnail: selectedDefault,
        };

        return updated;
      });
    },
    [selectedDefault]
  );

  useEffect(() => {
    if (!open) return;
    if (hasPendingUploads) return;
    if (!selectedDefault) return;

    const galleryKey = JSON.stringify(uniqueGallery);
    const nextState = { galleryKey, thumbnail: selectedDefault };

    // Evita chiamate se lo stato è invariato
    if (
      lastStateRef.current &&
      lastStateRef.current.galleryKey === nextState.galleryKey &&
      lastStateRef.current.thumbnail === nextState.thumbnail
    ) {
      return;
    }

    // Skippa il primo stato (seed iniziale)
    if (skipInitialRef.current) {
      skipInitialRef.current = false;
      lastStateRef.current = nextState;
      return;
    }

    // Evita re-entrancy
    if (inFlightRef.current) return;

    let cancelled = false;
    inFlightRef.current = true;
    setIsPersisting(true);

    const persist = async () => {
      try {
        await onPersist({ gallery: uniqueGallery, thumbnail: selectedDefault });
        if (!cancelled) {
          lastStateRef.current = nextState;
        }
      } catch (error) {
        console.error("Failed to persist product media", error);
      } finally {
        if (!cancelled) {
          setIsPersisting(false);
        }
        inFlightRef.current = false;
      }
    };

    void persist();

    return () => {
      cancelled = true;
    };
  }, [open, hasPendingUploads, uniqueGallery, selectedDefault, onPersist]);

  const confirmDisabled =
    isBusy || !selectedDefault || !hasReadyItems || isConfirming;

  const handleConfirm = useCallback(async () => {
    if (confirmDisabled || !selectedDefault) return;
    setIsConfirming(true);
    try {
      await onConfirm({ gallery: uniqueGallery, thumbnail: selectedDefault });
    } catch (err) {
      console.error("Failed to confirm media selection", err);
    } finally {
      setIsConfirming(false);
    }
  }, [confirmDisabled, onConfirm, selectedDefault, uniqueGallery]);

  return {
    ACCEPTED_TYPES,
    fileInputRef,
    mediaItems,
    dragOver,
    selectedDefault,
    hasReadyItems,
    hasPendingUploads,
    hasErrors,
    isPersisting,
    isBusy,
    isConfirming,
    confirmDisabled,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleFileInput,
    handleRemove,
    handleConfirm,
    setSelectedDefault,
  };
}
