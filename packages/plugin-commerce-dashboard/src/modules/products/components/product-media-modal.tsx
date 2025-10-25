import { useTranslation } from "react-i18next";
import { Button } from "@kitejs-cms/dashboard-core";
import { useProductMediaManager } from "../hooks/use-product-media";
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

interface ProductMediaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function ProductMediaModal({
  open,
  onOpenChange,
  gallery,
  thumbnail,
  onConfirm,
  onPersist,
}: ProductMediaModalProps) {
  const { t } = useTranslation("commerce");

  const manager = useProductMediaManager({
    open,
    gallery,
    thumbnail,
    onConfirm: async (payload) => {
      await onConfirm(payload);
    },
    onPersist,
  });

  const {
    ACCEPTED_TYPES,
    fileInputRef,
    mediaItems,
    dragOver,
    selectedDefault,
    hasPendingUploads,
    hasErrors,
    isPersisting,
    confirmDisabled,
    isConfirming,
    isBusy,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleFileInput,
    handleRemove,
    handleConfirm,
    setSelectedDefault,
  } = manager;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        position="full"
        className={`relative flex h-full flex-col overflow-hidden bg-background p-0 transition-colors ${
          dragOver ? "ring-4 ring-primary/40" : ""
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* HEADER */}
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
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("products.buttons.close") as string}
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>
        </div>

        {/* DRAG AREA */}
        <div
          className={`relative flex flex-col flex-1 overflow-hidden px-8 py-6 transition-colors ${
            dragOver ? "bg-primary/5" : ""
          }`}
        >
          {/* UPLOAD BAR */}
          <div
            className="mb-6 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 px-6 py-5 text-center cursor-pointer hover:bg-muted/50 transition"
            onClick={() => !isBusy && fileInputRef.current?.click()}
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {t(
                "products.details.media.dragInstruction",
                "Trascina qui i file o clicca per caricarli"
              )}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ACCEPTED_TYPES}
              multiple
              onChange={handleFileInput}
            />
          </div>

          {/* MEDIA GRID */}
          <ScrollArea className="flex-1">
            <div className="grid auto-rows-fr grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 justify-start">
              {mediaItems.map((item) => {
                const isDefault = item.url && selectedDefault === item.url;
                const isProcessing = item.status === "uploading";
                const isErrored = item.status === "error";

                return (
                  <div
                    key={item.id}
                    className="group relative flex w-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm"
                  >
                    {/* Anteprima */}
                    <div className="relative aspect-square w-full bg-muted flex items-center justify-center">
                      {item.type === "image" ? (
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          className="h-full w-full object-contain"
                        />
                      ) : item.type === "video" ? (
                        <Video className="h-14 w-14 text-muted-foreground" />
                      ) : (
                        <File className="h-14 w-14 text-muted-foreground" />
                      )}

                      {isProcessing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
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

                      {/* ⭐ Pulsante piccolo per predefinito */}
                      <button
                        type="button"
                        className={`absolute right-2 top-2 rounded-full p-1.5 transition cursor-pointer ${
                          isDefault
                            ? "bg-primary text-primary-foreground"
                            : "bg-background/80 text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => item.url && setSelectedDefault(item.url)}
                        disabled={!item.url || isProcessing || isBusy}
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
                          {item.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(item.id)}
                        className="text-muted-foreground hover:text-destructive p-2"
                        disabled={isBusy || isConfirming}
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
          <Button onClick={handleConfirm} disabled={confirmDisabled}>
            {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("products.details.media.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
