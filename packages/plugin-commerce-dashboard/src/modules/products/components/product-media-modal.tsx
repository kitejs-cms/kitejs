import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Button, useApi } from "@kitejs-cms/dashboard-core";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@kitejs-cms/dashboard-core/components/ui/dialog";
import {
  ScrollArea,
  ScrollBar,
} from "@kitejs-cms/dashboard-core/components/ui/scroll-area";
import {
  AlertTriangle,
  Upload,
  Loader2,
  Image as ImageIcon,
  Video,
  File,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useProductMediaSync } from "../hooks/use-product-media-sync";

interface ProductMediaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gallery: string[];
  thumbnail?: string;
  onConfirm: (payload: { gallery: string[]; thumbnail: string }) => Promise<void> | void;
  onPersist: (payload: { gallery: string[]; thumbnail: string }) => Promise<void> | void;
}

type MediaStatus = "idle" | "uploading" | "error";

type MediaType = "image" | "video" | "file";

type MediaItem = {
  id: string;
  name: string;
  url: string | null;
  previewUrl: string;
  previewIsObject: boolean;
  status: MediaStatus;
  type: MediaType;
};

const ACCEPTED_TYPES = "image/*,video/*";
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
  const normalized = url.split("?")[0]?.split("#")[0] ?? "";
  const extension = normalized.split(".").pop()?.toLowerCase();
  if (!extension) return "file";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "avif"].includes(extension)) {
    return "image";
  }
  if (["mp4", "webm", "ogg", "mov", "m4v"].includes(extension)) {
    return "video";
  }
  return "file";
};

const getNameFromUrl = (url: string) => {
  try {
    const parts = url.split("/");
    return decodeURIComponent(parts[parts.length - 1] || url);
  } catch (error) {
    console.warn("Unable to parse media name", error);
    return url;
  }
};

export function ProductMediaModal({
  open,
  onOpenChange,
  gallery,
  thumbnail,
  onConfirm,
}: ProductMediaModalProps) {
  const { t } = useTranslation("commerce");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useApi();
  const [dragOver, setDragOver] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedDefault, setSelectedDefault] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const hasReadyItems = useMemo(() => mediaItems.some((item) => Boolean(item.url)), [mediaItems]);
  const hasPendingUploads = useMemo(
    () => mediaItems.some((item) => item.status === "uploading" || !item.url),
    [mediaItems]
  );
  const hasErrors = useMemo(() => mediaItems.some((item) => item.status === "error"), [mediaItems]);

  const readyGallery = useMemo(
    () => mediaItems.filter((item) => item.url).map((item) => item.url as string),
    [mediaItems]
  );

  const uniqueGallery = useMemo(
    () => readyGallery.filter((url, index) => readyGallery.indexOf(url) === index),
    [readyGallery]
  );

  const isPersisting = useProductMediaSync({
    open,
    hasPendingUploads,
    gallery: uniqueGallery,
    thumbnail: selectedDefault,
    onPersist,
  });

  const isBusy = hasPendingUploads || isPersisting;

  useEffect(() => {
    if (!open) {
      mediaItems.forEach((item) => {
        if (item.previewIsObject) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      setMediaItems([]);
      setSelectedDefault(null);
      setDragOver(false);
      return;
    }

    const combined = Array.from(
      new Set(
        [...(gallery ?? []), thumbnail].filter(
          (value): value is string => Boolean(value && value.trim().length > 0)
        )
      )
    );

    const seededItems = combined.map((url) => ({
      id: createId(),
      name: getNameFromUrl(url),
      url,
      previewUrl: url,
      previewIsObject: false,
      status: "idle" as MediaStatus,
      type: getTypeFromUrl(url),
    }));

    setMediaItems(seededItems);
    if (thumbnail && combined.includes(thumbnail)) {
      setSelectedDefault(thumbnail);
    } else if (seededItems.length > 0) {
      const first = seededItems.find((item) => item.url);
      setSelectedDefault(first?.url ?? null);
    } else {
      setSelectedDefault(null);
    }
  }, [open, gallery, thumbnail]);

  useEffect(() => {
    if (!selectedDefault) {
      const first = mediaItems.find((item) => item.url);
      if (first) setSelectedDefault(first.url);
      return;
    }

    const exists = mediaItems.some((item) => item.url === selectedDefault);
    if (!exists) {
      const fallback = mediaItems.find((item) => item.url);
      setSelectedDefault(fallback?.url ?? null);
    }
  }, [mediaItems, selectedDefault]);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const queue = Array.from(files);
      if (queue.length === 0) return;

      const newItems: MediaItem[] = queue.map((file) => {
        const previewUrl = URL.createObjectURL(file);
        return {
          id: createId(),
          name: file.name,
          url: null,
          previewUrl,
          previewIsObject: true,
          status: "uploading" as MediaStatus,
          type: getTypeFromFile(file),
        };
      });

      setMediaItems((prev) => [...prev, ...newItems]);

      await Promise.all(
        newItems.map(async (item, index) => {
          const file = queue[index];
          const formData = new FormData();
          formData.append("file", file);
          formData.append("dir", UPLOAD_DIR);

          try {
            const { data } = await uploadFile("storage/upload", formData);
            const url = (data as { url: string }).url;
            URL.revokeObjectURL(item.previewUrl);
            setMediaItems((prev) =>
              prev.map((prevItem) =>
                prevItem.id === item.id
                  ? {
                      ...prevItem,
                      url,
                      previewUrl: url,
                      previewIsObject: false,
                      status: "idle",
                      type: getTypeFromUrl(url),
                    }
                  : prevItem
              )
            );
            setSelectedDefault((current) => current ?? url);
          } catch (error) {
            console.error("Errore durante l'upload dei media", error);
            setMediaItems((prev) =>
              prev.map((prevItem) =>
                prevItem.id === item.id
                  ? {
                      ...prevItem,
                      status: "error",
                    }
                  : prevItem
              )
            );
          }
        })
      );
    },
    [uploadFile]
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setDragOver(false);
      if (isBusy) return;
      if (event.dataTransfer.files?.length) {
        await handleFiles(event.dataTransfer.files);
      }
    },
    [handleFiles, isBusy]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isBusy) return;
    setDragOver(true);
  }, [isBusy]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.contains(event.relatedTarget as Node)) {
      return;
    }
    setDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (isBusy || !event.target.files?.length) return;
      await handleFiles(event.target.files);
      event.target.value = "";
    },
    [handleFiles, isBusy]
  );

  const handleRemove = useCallback((id: string) => {
    setMediaItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewIsObject) {
        URL.revokeObjectURL(target.previewUrl);
      }
      const updated = prev.filter((item) => item.id !== id);
      if (target?.url && selectedDefault === target.url) {
        const fallback = updated.find((item) => item.url);
        setSelectedDefault(fallback?.url ?? null);
      }
      return updated;
    });
  }, [selectedDefault]);

  const confirmDisabled = isBusy || !selectedDefault || !hasReadyItems || isConfirming;

  const handleConfirm = useCallback(async () => {
    if (confirmDisabled || !selectedDefault) return;
    setIsConfirming(true);
    try {
      await onConfirm({ gallery: uniqueGallery, thumbnail: selectedDefault });
    } catch (error) {
      console.error("Failed to confirm media selection", error);
    } finally {
      setIsConfirming(false);
    }
  }, [confirmDisabled, onConfirm, selectedDefault, uniqueGallery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        position="full"
        className={`relative flex h-full flex-col overflow-hidden bg-background p-0 transition-colors ${
          dragOver ? "ring-2 ring-primary" : ""
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex items-start justify-between border-b px-8 py-6">
          <div className="space-y-1">
            <DialogTitle className="text-2xl font-semibold">
              {t("products.details.media.modalTitle")}
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              {t("products.details.media.modalDescription")}
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" aria-label={t("products.buttons.close", "Close") as string}>
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-hidden px-8 py-6 lg:flex-row">
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {mediaItems.length ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {mediaItems.map((item) => {
                    const isDefault = item.url && selectedDefault === item.url;
                    const isProcessing = item.status === "uploading";
                    const isErrored = item.status === "error";
                    return (
                      <div
                        key={item.id}
                        className="group relative flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => item.url && setSelectedDefault(item.url)}
                          disabled={!item.url || isProcessing || isBusy || isConfirming}
                          className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-muted p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {item.type === "image" ? (
                            <img src={item.previewUrl} alt={item.name} className="max-h-full max-w-full object-contain" />
                          ) : item.type === "video" ? (
                            <div className="flex h-full w-full items-center justify-center">
                              <Video className="h-12 w-12 text-muted-foreground" />
                            </div>
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                              <File className="h-12 w-12" />
                              <span className="max-w-[80%] truncate text-[11px] font-medium" title={item.name}>
                                {item.name}
                              </span>
                            </div>
                          )}

                          {isProcessing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                              <Loader2 className="h-6 w-6 animate-spin text-white" />
                            </div>
                          )}

                          {isErrored && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-destructive/90 text-destructive-foreground">
                              <AlertTriangle className="h-5 w-5" />
                              <span className="text-xs font-semibold">
                                {t("products.details.media.uploadError")}
                              </span>
                            </div>
                          )}

                          {isDefault && (
                            <Badge className="absolute left-3 top-3 flex items-center gap-1 bg-primary text-primary-foreground">
                              <Star className="h-3 w-3" />
                              {t("products.details.media.defaultBadge")}
                            </Badge>
                          )}
                        </button>

                        <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
                          <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
                            {item.type === "image" ? (
                              <ImageIcon className="h-4 w-4 shrink-0" />
                            ) : item.type === "video" ? (
                              <Video className="h-4 w-4 shrink-0" />
                            ) : (
                              <File className="h-4 w-4 shrink-0" />
                            )}
                            <span className="truncate" title={item.name}>
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isDefault && item.url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedDefault(item.url as string)}
                                disabled={isBusy || isConfirming}
                              >
                                <Star className="mr-1 h-4 w-4" />
                                {t("products.details.media.setDefault")}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemove(item.id)}
                              className="text-muted-foreground hover:text-destructive"
                              disabled={isBusy || isConfirming}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-muted/40 p-10 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Upload className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold">
                      {t("products.details.media.emptyState")}
                    </p>
                    <p className="max-w-md text-sm text-muted-foreground">
                      {t("products.details.media.emptyStateDescription")}
                    </p>
                  </div>
                </div>
              )}
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </div>

          <div className="w-full max-w-sm shrink-0 space-y-4">
            <div
              className={`flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-6 text-center transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/40 bg-muted/50"
              } ${isBusy ? "opacity-70" : "cursor-pointer"}`}
              onClick={() => {
                if (!isBusy) fileInputRef.current?.click();
              }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  {t("products.details.media.uploadTitle")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("products.details.media.uploadDescription")}
                </p>
              </div>
              <Button type="button" size="sm" disabled={isBusy}>
                {t("products.details.media.uploadButton")}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={ACCEPTED_TYPES}
                multiple
                onChange={handleFileInput}
              />
            </div>

            {hasPendingUploads && (
              <div className="rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm text-primary">
                {t("products.details.media.pendingUploads")}
              </div>
            )}
            {isPersisting && (
              <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("products.details.media.syncing")}
              </div>
            )}
            {!hasPendingUploads && !confirmDisabled && hasErrors && (
              <div className="rounded-md border border-amber-200 bg-amber-100 px-3 py-2 text-sm text-amber-900">
                {t("products.details.media.errorReminder")}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t px-8 py-6">
          <DialogClose asChild>
            <Button variant="outline">{t("products.buttons.cancel")}</Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={confirmDisabled}>
            {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("products.details.media.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
