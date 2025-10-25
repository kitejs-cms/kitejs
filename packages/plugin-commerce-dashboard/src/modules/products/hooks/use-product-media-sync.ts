import { useEffect, useRef, useState } from "react";

interface UseProductMediaSyncOptions {
  open: boolean;
  hasPendingUploads: boolean;
  gallery: string[];
  thumbnail: string | null;
  onPersist: (payload: { gallery: string[]; thumbnail: string }) => Promise<void> | void;
}

export function useProductMediaSync({
  open,
  hasPendingUploads,
  gallery,
  thumbnail,
  onPersist,
}: UseProductMediaSyncOptions) {
  const [isPersisting, setIsPersisting] = useState(false);
  const skipInitialRef = useRef(true);
  const lastStateRef = useRef<{ galleryKey: string; thumbnail: string | null } | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!open) {
      skipInitialRef.current = true;
      lastStateRef.current = null;
      inFlightRef.current = false;
      setIsPersisting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (hasPendingUploads) return;
    if (!thumbnail) return;

    const galleryKey = JSON.stringify(gallery);
    const nextState = { galleryKey, thumbnail };

    if (
      lastStateRef.current &&
      lastStateRef.current.galleryKey === nextState.galleryKey &&
      lastStateRef.current.thumbnail === nextState.thumbnail
    ) {
      return;
    }

    if (skipInitialRef.current) {
      skipInitialRef.current = false;
      lastStateRef.current = nextState;
      return;
    }

    if (inFlightRef.current) return;

    let cancelled = false;
    inFlightRef.current = true;
    setIsPersisting(true);

    const persist = async () => {
      try {
        await onPersist({ gallery, thumbnail });
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to persist product media", error);
        }
      } finally {
        if (!cancelled) {
          lastStateRef.current = nextState;
          setIsPersisting(false);
        }
        inFlightRef.current = false;
      }
    };

    void persist();

    return () => {
      cancelled = true;
    };
  }, [gallery, hasPendingUploads, onPersist, open, thumbnail]);

  return isPersisting;
}
