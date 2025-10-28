import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Button,
  Input,
  Label,
  Textarea,
} from "@kitejs-cms/dashboard-core";
import {
  useProductMediaManager,
  type MediaSource,
} from "../hooks/use-product-media";
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
  Upload,
  Loader2,
  Image as ImageIcon,
  Video,
  File,
  Star,
  Trash2,
  XIcon,
} from "lucide-react";

interface ProductMediaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gallery: MediaSource[];
  thumbnail?: string | null;
  language: string;
  onConfirm: (payload: {
    gallery: string[];
    thumbnail: string;
  }) => Promise<void> | void;
  onPersist: (payload: {
    gallery: string[];
    thumbnail: string;
  }) => Promise<void> | void;
}

export function ProductMediaModal({
  open,
  onOpenChange,
  gallery,
  thumbnail,
  language,
  onConfirm,
  onPersist,
}: ProductMediaModalProps) {
  const { t } = useTranslation("commerce");
  const [activeMediaId, setActiveMediaId] = useState<string | null>(null);

  const {
    ACCEPTED_TYPES,
    fileInputRef,
    mediaItems,
    selectedDefault,
    hasPendingUploads,
    hasErrors,
    isPersisting,
    isConfirming,
    isBusy,
    handleFileInput,
    handleRemove,
    handleConfirm,
    handleSetDefault,
    handleMetadataChange,
    handleMetadataSave,
    getAssetId,
  } = useProductMediaManager({
    open,
    gallery,
    thumbnail,
    language,
    onConfirm,
    onPersist,
  });

  useEffect(() => {
    if (!open) return;
    if (
      activeMediaId &&
      mediaItems.some((item) => getAssetId(item) === activeMediaId)
    ) {
      return;
    }

    const firstAvailable =
      mediaItems.find((item) => item.assetId) ?? mediaItems[0];

    setActiveMediaId(firstAvailable ? getAssetId(firstAvailable) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mediaItems]);

  const activeMedia = useMemo(
    () =>
      mediaItems.find((item) => getAssetId(item) === activeMediaId) ?? null,
    [activeMediaId, mediaItems, getAssetId]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        position="full"
        className="relative flex h-full flex-col overflow-hidden bg-background p-0 transition-colors"
      >
        {/* HEADER */}
        <div className="flex items-start justify-between border-b px-4 py-4">
          <div className="space-y-1">
            <DialogTitle className="text-2xl font-semibold">
              {t("products.details.media.modalTitle")}
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              {t("products.details.media.modalDescription")}
            </DialogDescription>
          </div>

          <DialogClose className="flex items-center gap-2 text-gray-500 hover:text-black transition cursor-pointer">
            <Badge
              variant="outline"
              className="bg-gray-100 text-gray-400 border-gray-400 font-medium px-2 py-0.5"
            >
              Esc
            </Badge>
            <XIcon className="w-5 h-5" />
          </DialogClose>
        </div>

        {/* BODY */}
        <div className="relative flex flex-col flex-1 overflow-hidden px-8 py-6">
          {/* UPLOAD BAR */}
          <div
            className="mb-6 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 px-6 py-5 text-center cursor-pointer hover:bg-muted/50 transition"
            onClick={() => !isBusy && fileInputRef.current?.click()}
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {t(
                "products.details.media.uploadInstruction",
                "Clicca qui per caricare immagini o video"
              )}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ACCEPTED_TYPES}
              multiple
              onChange={(e) => handleFileInput(e.target.files!)}
            />
          </div>

          {/* MEDIA GRID */}
          <ScrollArea className="flex-1">
            <div className="grid auto-rows-fr grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 justify-start">
              {mediaItems.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/40 bg-muted/10 p-10 text-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium text-muted-foreground">
                    {t("products.details.media.emptyState")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("products.details.media.emptyStateDescription")}
                  </p>
                </div>
              )}

              {mediaItems.map((item) => {
                const identifier = getAssetId(item);
                const isDefault = Boolean(
                  item.assetId && selectedDefault === item.assetId
                );
                const isActive = activeMediaId === identifier;
                const displayUrl = item.previewUrl ?? item.url ?? undefined;
                const isUploading = item.status === "uploading";
                const isErrored = item.status === "error";

                return (
                  <div
                    key={identifier}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveMediaId(identifier)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setActiveMediaId(identifier);
                      }
                    }}
                    className={`group relative flex w-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition ${
                      isActive ? "border-primary ring-2 ring-primary/40" : ""
                    } ${isErrored ? "border-destructive" : ""}`}
                  >
                    {/* Anteprima */}
                    <div className="relative aspect-square w-full bg-muted flex items-center justify-center">
                      {item.type === "image" && displayUrl ? (
                        <img
                          src={displayUrl}
                          alt={item.name}
                          className="h-full w-full object-contain"
                        />
                      ) : item.type === "video" ? (
                        <Video className="h-14 w-14 text-muted-foreground" />
                      ) : (
                        <File className="h-14 w-14 text-muted-foreground" />
                      )}

                      {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      )}

                      {isErrored && (
                        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
                          <Badge variant="destructive" className="text-xs">
                            {t("products.details.media.uploadError")}
                          </Badge>
                        </div>
                      )}

                      {/* ⭐ Pulsante predefinito */}
                      <button
                        type="button"
                        className={`absolute right-2 top-2 rounded-full p-1.5 transition cursor-pointer ${
                          isDefault
                            ? "bg-primary text-primary-foreground"
                            : "bg-background/80 text-muted-foreground hover:text-foreground"
                        } ${!item.assetId ? "opacity-50 cursor-not-allowed" : ""}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!item.assetId || isUploading) return;
                          void handleSetDefault(item.assetId);
                        }}
                        disabled={!item.assetId || isUploading || isBusy}
                      >
                        <Star className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Footer media */}
                    <div className="flex items-center justify-between gap-2 border-t px-4 py-3 text-sm">
                      <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                        {item.type === "image" ? (
                          <ImageIcon className="h-4 w-4 shrink-0" />
                        ) : item.type === "video" ? (
                          <Video className="h-4 w-4 shrink-0" />
                        ) : (
                          <File className="h-4 w-4 shrink-0" />
                        )}
                        <span className="truncate font-medium">
                          {item.name || identifier}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemove(identifier);
                        }}
                        className="text-muted-foreground hover:text-destructive p-2"
                        disabled={isBusy || isConfirming || isUploading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>

          {/* METADATA FORM */}
          <div className="mt-6 rounded-xl border bg-background p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-1">
              <h3 className="text-lg font-semibold">
                {t("products.details.media.metadata.title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("products.details.media.metadata.subtitle", {
                  language: language.toUpperCase(),
                })}
              </p>
            </div>

            {!activeMedia ? (
              <p className="text-sm text-muted-foreground">
                {t("products.details.media.metadata.selectHint")}
              </p>
            ) : !activeMedia.assetId ? (
              <p className="text-sm text-muted-foreground">
                {t("products.details.media.metadata.pendingUpload")}
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="media-alt">
                      {t("products.details.media.metadata.alt")}
                    </Label>
                    <Input
                      id="media-alt"
                      value={
                        activeMedia.metadata.alt?.[language] ?? ""
                      }
                      disabled={activeMedia.isSavingMetadata || isBusy}
                      onChange={(event) =>
                        handleMetadataChange(
                          getAssetId(activeMedia),
                          "alt",
                          event.target.value
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="media-title">
                      {t("products.details.media.metadata.titleField")}
                    </Label>
                    <Input
                      id="media-title"
                      value={
                        activeMedia.metadata.title?.[language] ?? ""
                      }
                      disabled={activeMedia.isSavingMetadata || isBusy}
                      onChange={(event) =>
                        handleMetadataChange(
                          getAssetId(activeMedia),
                          "title",
                          event.target.value
                        )
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="media-description">
                    {t("products.details.media.metadata.description")}
                  </Label>
                  <Textarea
                    id="media-description"
                    value={
                      activeMedia.metadata.description?.[language] ?? ""
                    }
                    disabled={activeMedia.isSavingMetadata || isBusy}
                    onChange={(event) =>
                      handleMetadataChange(
                        getAssetId(activeMedia),
                        "description",
                        event.target.value
                      )
                    }
                    className="min-h-[120px]"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() =>
                      activeMedia.assetId &&
                      handleMetadataSave(activeMedia.assetId)
                    }
                    disabled={
                      !activeMedia.assetId ||
                      activeMedia.isSavingMetadata ||
                      isBusy
                    }
                  >
                    {activeMedia.isSavingMetadata && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t("products.details.media.metadata.save")}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* STATUS BANNER */}
          <div className="mt-4 space-y-2">
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
            {hasErrors && !hasPendingUploads && (
              <div className="rounded-md border border-amber-200 bg-amber-100 px-3 py-2 text-sm text-amber-900">
                {t("products.details.media.errorReminder")}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <DialogFooter className="border-t px-8 py-6">
          <DialogClose asChild>
            <Button variant="outline">{t("products.buttons.cancel")}</Button>
          </DialogClose>
          <Button
            onClick={() => void handleConfirm()}
            disabled={isBusy || hasPendingUploads}
          >
            {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("products.details.media.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
