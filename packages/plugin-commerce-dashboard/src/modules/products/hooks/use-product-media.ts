import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StorageResponseDetailsModel } from "@kitejs-cms/core";
import { IdGenerator, useApi } from "@kitejs-cms/dashboard-core";
import { getTypeFromFile, getTypeFromUrl } from "../helpers";

type MediaStatus = "idle" | "uploading" | "error";
type MediaType = "image" | "video" | "file";

export const ACCEPTED_TYPES = "image/*,video/*";
const UPLOAD_DIR = "commerce/products";

export type MediaSource =
  | string
  | (StorageResponseDetailsModel & {
      id?: string;
      assetId?: string;
      _id?: string;
    });

type MediaMetadata = {
  alt: Record<string, string>;
  title: Record<string, string>;
  description: Record<string, string>;
};

export interface MediaItem {
  /** Internal identifier used for rendering */
  internalId: string;
  /** Storage asset identifier returned by the backend */
  assetId: string | null;
  name: string;
  url: string | null;
  previewUrl: string | null;
  previewIsObject: boolean;
  status: MediaStatus;
  type: MediaType;
  metadata: MediaMetadata;
  isSavingMetadata: boolean;
}

export interface UseProductMediaManagerOptions {
  open: boolean;
  gallery: MediaSource[];
  thumbnail?: string | null;
  language: string;
  onConfirm: (payload: {
    gallery: string[];
    thumbnail: string;
  }) => Promise<void> | void;
  onPersist?: (payload: {
    gallery: string[];
    thumbnail: string;
  }) => Promise<void> | void;
}

const isLikelyUrl = (value: string) => /^https?:\/\//i.test(value);

const deriveType = (url?: string | null, mediaType?: string): MediaType => {
  if (mediaType?.startsWith("video")) return "video";
  if (mediaType?.startsWith("image")) return "image";
  if (url) return getTypeFromUrl(url);
  return "file";
};

const normalizeMediaItems = (gallery: MediaSource[]): MediaItem[] =>
  gallery.map((entry) => {
    if (typeof entry === "string") {
      const assetId = isLikelyUrl(entry) ? null : entry;
      const url = isLikelyUrl(entry) ? entry : null;
      return {
        internalId: assetId ?? IdGenerator.nanoid(),
        assetId,
        name: entry,
        url,
        previewUrl: url,
        previewIsObject: false,
        status: "idle" as MediaStatus,
        type: deriveType(url),
        metadata: { alt: {}, title: {}, description: {} },
        isSavingMetadata: false,
      } satisfies MediaItem;
    }

    const assetId =
      entry.assetId ?? entry.id ?? entry._id ?? entry.path ?? null;
    const url = entry.url ?? null;

    return {
      internalId: assetId ?? IdGenerator.nanoid(),
      assetId,
      name: entry.name ?? entry.path ?? assetId ?? "",
      url,
      previewUrl: url,
      previewIsObject: false,
      status: "idle",
      type: deriveType(url, entry.mediaType),
      metadata: {
        alt: entry.alt ?? {},
        title: entry.title ?? {},
        description: entry.description ?? {},
      },
      isSavingMetadata: false,
    } satisfies MediaItem;
  });

const getAssetId = (item: MediaItem) => item.assetId ?? item.internalId;

export function useProductMediaManager({
  open,
  gallery,
  thumbnail,
  language,
  onConfirm,
  onPersist,
}: UseProductMediaManagerOptions) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(
    normalizeMediaItems(gallery)
  );
  const [selectedDefault, setSelectedDefault] = useState<string | null>(
    thumbnail ?? null
  );
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPersisting, setIsPersisting] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);

  const mediaItemsRef = useRef<MediaItem[]>(mediaItems);
  const selectedDefaultRef = useRef<string | null>(selectedDefault);

  const { uploadFile, fetchData } = useApi();

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    mediaItemsRef.current = mediaItems;
  }, [mediaItems]);

  useEffect(() => {
    selectedDefaultRef.current = selectedDefault;
  }, [selectedDefault]);

  useEffect(() => {
    if (!open) return;
    const normalized = normalizeMediaItems(gallery);
    setMediaItems(normalized);

    if (thumbnail) {
      setSelectedDefault(thumbnail);
      return;
    }

    const firstAsset = normalized.find((item) => item.assetId)?.assetId ?? null;
    setSelectedDefault(firstAsset);
  }, [gallery, open, thumbnail]);

  // 💡 Derived states
  const hasPendingUploads = useMemo(
    () => mediaItems.some((item) => item.status === "uploading"),
    [mediaItems]
  );

  const hasReadyItems = useMemo(
    () => mediaItems.some((item) => Boolean(item.assetId)),
    [mediaItems]
  );

  const isBusy = isConfirming || isPersisting || hasPendingUploads;

  const persistGallery = useCallback(
    async (items: MediaItem[], nextDefault?: string | null) => {
      if (!onPersist) return;

      const assetIds = items
        .map((item) => item.assetId)
        .filter((id): id is string => Boolean(id));

      const defaultCandidate =
        nextDefault ??
        (assetIds.includes(selectedDefaultRef.current ?? "")
          ? selectedDefaultRef.current
          : assetIds[0] ?? "");

      setIsPersisting(true);
      try {
        await onPersist({
          gallery: assetIds,
          thumbnail: defaultCandidate ?? "",
        });
        setHasErrors(false);
      } catch (error) {
        setHasErrors(true);
        throw error;
      } finally {
        setIsPersisting(false);
      }
    },
    [onPersist]
  );

  // 📂 Handler upload
  const handleFileInput = useCallback(
    async (files: FileList | File[]) => {
      const queue = Array.from(files);
      if (!queue.length) return;

      const temporaryItems: MediaItem[] = queue.map((file) => ({
        internalId: IdGenerator.nanoid(),
        assetId: null,
        name: file.name,
        url: null,
        previewUrl: URL.createObjectURL(file),
        previewIsObject: true,
        status: "uploading",
        type: getTypeFromFile(file),
        metadata: { alt: {}, title: {}, description: {} },
        isSavingMetadata: false,
      }));

      setMediaItems((prev) => [...prev, ...temporaryItems]);
      setHasErrors(false);

      let didUploadSucceed = false;

      await Promise.all(
        temporaryItems.map(async (item, index) => {
          const file = queue[index];
          const form = new FormData();
          form.append("file", file);
          form.append("dir", UPLOAD_DIR);

          try {
            const { data } = await uploadFile("storage/upload", form);
            const { url, assetId } = data as { url: string; assetId: string };

            setMediaItems((prev) =>
              prev.map((entry) => {
                if (entry.internalId !== item.internalId) return entry;

                if (entry.previewIsObject && entry.previewUrl) {
                  URL.revokeObjectURL(entry.previewUrl);
                }

                return {
                  ...entry,
                  assetId,
                  url,
                  previewUrl: url,
                  previewIsObject: false,
                  status: "idle" as MediaStatus,
                };
              })
            );

            setSelectedDefault((current) => current ?? assetId);
            didUploadSucceed = true;
          } catch (error) {
            console.error("Failed to upload media", error);
            setHasErrors(true);
            setMediaItems((prev) =>
              prev.map((entry) =>
                entry.internalId === item.internalId
                  ? { ...entry, status: "error" as MediaStatus }
                  : entry
              )
            );
          }
        })
      );

      if (didUploadSucceed) {
        const nextItems = mediaItemsRef.current;
        const fallbackDefault =
          selectedDefaultRef.current ??
          nextItems.find((entry) => entry.assetId)?.assetId ??
            null;

        try {
          await persistGallery(nextItems, fallbackDefault);
        } catch (error) {
          console.error("Unable to persist gallery after upload", error);
        }
      }
    },
    [persistGallery, uploadFile]
  );

  // 🗑️ Handler rimozione media
  const handleRemove = useCallback(
    async (targetId: string) => {
      const target = mediaItems.find(
        (item) =>
          item.assetId === targetId || item.internalId === targetId
      );
      if (target?.previewIsObject && target.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }

      const nextItems = mediaItems.filter(
        (item) =>
          item.assetId !== targetId && item.internalId !== targetId
      );

      const hasDefault = nextItems.some(
        (item) => item.assetId === selectedDefaultRef.current
      );

      const fallbackDefault = hasDefault
        ? selectedDefaultRef.current
        : nextItems.find((item) => item.assetId)?.assetId ?? null;

      setMediaItems(nextItems);
      setSelectedDefault(fallbackDefault ?? null);

      try {
        await persistGallery(nextItems, fallbackDefault);
        setHasErrors(false);
      } catch (error) {
        console.error("Failed to persist gallery after removal", error);
      }
    },
    [mediaItems, persistGallery]
  );

  // ⭐ Handler per settare il default
  const handleSetDefault = useCallback(
    async (assetId: string | null) => {
      if (!assetId) return;
      setSelectedDefault(assetId);

      try {
        await persistGallery(mediaItemsRef.current, assetId);
      } catch (error) {
        console.error("Unable to persist default media", error);
      }
    },
    [persistGallery]
  );

  // 📝 Gestione metadati SEO
  const handleMetadataChange = useCallback(
    (assetId: string, field: keyof MediaMetadata, value: string) => {
      setMediaItems((prev) =>
        prev.map((item) => {
          if (item.assetId !== assetId && item.internalId !== assetId) {
            return item;
          }

          return {
            ...item,
            metadata: {
              ...item.metadata,
              [field]: {
                ...item.metadata[field],
                [language]: value,
              },
            },
          };
        })
      );
    },
    [language]
  );

  const handleMetadataSave = useCallback(
    async (assetId: string) => {
      const target = mediaItemsRef.current.find(
        (item) => item.assetId === assetId || item.internalId === assetId
      );

      if (!target || !target.assetId) {
        return;
      }

      const payloadEntries: Partial<Record<keyof MediaMetadata, string>> = {
        alt: target.metadata.alt?.[language]?.trim(),
        title: target.metadata.title?.[language]?.trim(),
        description: target.metadata.description?.[language]?.trim(),
      };

      const body = Object.fromEntries(
        Object.entries(payloadEntries).filter(
          ([, value]) => Boolean(value)
        )
      );

      if (Object.keys(body).length === 0) {
        return;
      }

      setMediaItems((prev) =>
        prev.map((item) =>
          item.assetId === target.assetId
            ? { ...item, isSavingMetadata: true }
            : item
        )
      );

      try {
        await fetchData(
          `storage/${target.assetId}/metadata`,
          "PATCH",
          body,
          {
            headers: {
              "Accept-Language": language,
            },
          }
        );
        setHasErrors(false);
      } catch (error) {
        console.error("Failed to update media metadata", error);
        setHasErrors(true);
        throw error;
      } finally {
        setMediaItems((prev) =>
          prev.map((item) =>
            item.assetId === target.assetId
              ? { ...item, isSavingMetadata: false }
              : item
          )
        );
      }
    },
    [fetchData, language]
  );

  // ✅ Conferma manuale
  const handleConfirm = useCallback(async () => {
    if (hasPendingUploads) return;

    const assetIds = mediaItems
      .map((item) => item.assetId)
      .filter((id): id is string => Boolean(id));

    const thumbnailId = assetIds.includes(selectedDefault ?? "")
      ? selectedDefault!
      : assetIds[0] ?? "";

    setIsConfirming(true);

    try {
      await onConfirm({ gallery: assetIds, thumbnail: thumbnailId });
      setHasErrors(false);
    } catch (error) {
      console.error("Failed to confirm product media", error);
      setHasErrors(true);
      throw error;
    } finally {
      setIsConfirming(false);
    }
  }, [hasPendingUploads, mediaItems, onConfirm, selectedDefault]);

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
    handleMetadataChange,
    handleMetadataSave,
    getAssetId,
    setMediaItems,
    setSelectedDefault,
    setIsConfirming,
    setIsPersisting,
    setHasErrors,
  };
}
