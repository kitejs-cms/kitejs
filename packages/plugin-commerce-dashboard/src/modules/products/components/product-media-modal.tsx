import { useTranslation } from "react-i18next";
import { Badge, Button } from "@kitejs-cms/dashboard-core";
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
  Upload,
  Loader2,
  Image as ImageIcon,
  Video,
  File,
  Star,
  Trash2,
  XIcon,
} from "lucide-react";
import { getTypeFromUrl } from "../helpers";

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
}: ProductMediaModalProps) {
  const { t } = useTranslation("commerce");

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
  } = useProductMediaManager({
    open,
    gallery,
    thumbnail,
    onConfirm,
  });

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
              {mediaItems.map((item) => {
                const isDefault = item && selectedDefault === item;

                return (
                  <div
                    key={item}
                    className="group relative flex w-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm"
                  >
                    {/* Anteprima */}
                    <div className="relative aspect-square w-full bg-muted flex items-center justify-center">
                      {getTypeFromUrl(item) === "image" ? (
                        <img
                          src={item}
                          alt={item}
                          className="h-full w-full object-contain"
                        />
                      ) : getTypeFromUrl(item) === "video" ? (
                        <Video className="h-14 w-14 text-muted-foreground" />
                      ) : (
                        <File className="h-14 w-14 text-muted-foreground" />
                      )}

                      {/* ⭐ Pulsante predefinito */}
                      <button
                        type="button"
                        className={`absolute right-2 top-2 rounded-full p-1.5 transition cursor-pointer ${
                          isDefault
                            ? "bg-primary text-primary-foreground"
                            : "bg-background/80 text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => item && handleSetDefault(item)}
                      >
                        <Star className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Footer media */}
                    <div className="flex items-center justify-between gap-2 border-t px-4 py-3 text-sm">
                      <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                        {getTypeFromUrl(item) === "image" ? (
                          <ImageIcon className="h-4 w-4 shrink-0" />
                        ) : getTypeFromUrl(item) === "video" ? (
                          <Video className="h-4 w-4 shrink-0" />
                        ) : (
                          <File className="h-4 w-4 shrink-0" />
                        )}
                        <span className="truncate font-medium">{item}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(item)}
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
          <Button onClick={handleConfirm}>
            {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("products.details.media.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
