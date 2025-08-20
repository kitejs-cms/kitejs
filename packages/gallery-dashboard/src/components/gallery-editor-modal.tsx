import { useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Label,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
} from "@kitejs-cms/dashboard-core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@kitejs-cms/dashboard-core/components/ui/dialog";
import { ScrollArea } from "@kitejs-cms/dashboard-core/components/ui/scroll-area";
import { XIcon, Settings2 } from "lucide-react";
import type { GalleryItemModel } from "@kitejs-cms/gallery-plugin";

interface Item extends GalleryItemModel {
  id: string;
}

interface GridSettings {
  layout: string;
  columns: string;
  gap: string;
  ratio: string;
}

interface GalleryEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  gridSettings: GridSettings;
  onUpload: (file: File) => void;
  onSort: (ids: string[]) => void;
  onDelete: (id: string) => void;
  onGridChange: (field: keyof GridSettings, value: string) => void;
}

export function GalleryEditorModal({
  isOpen,
  onClose,
  items,
  gridSettings,
  onUpload,
  onSort,
  onDelete,
  onGridChange,
}: GalleryEditorModalProps) {
  const { t } = useTranslation("gallery");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(true);

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  const handleDragStart = (idx: number) => setDragIndex(idx);
  const handleDrop = (idx: number) => {
    if (dragIndex === null || dragIndex === idx) return;
    const reordered = [...items];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(idx, 0, moved);
    onSort(reordered.map((i) => i.id));
    setDragIndex(null);
  };
  const aspectRatio = gridSettings.ratio.includes(":")
    ? gridSettings.ratio.replace(":", " / ")
    : gridSettings.ratio;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        position="full"
        className="p-0 flex flex-col overflow-hidden rounded-none h-full"
      >
        <DialogHeader className="flex flex-row justify-between items-center p-4 border-b shrink-0">
          <DialogTitle className="text-xl font-semibold">
            {t("title.editGallery")}
          </DialogTitle>
          <DialogClose asChild>
            <div className="flex items-center gap-2 text-gray-500 hover:text-tesrblack transition cursor-pointer">
              <Badge
                variant="outline"
                className="bg-gray-100 text-gray-400 border-gray-400 font-medium px-2 py-0.5"
              >
                Esc
              </Badge>
              <XIcon className="w-5 h-5" />
            </div>
          </DialogClose>
        </DialogHeader>
        <div className="relative flex flex-1">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${gridSettings.columns}, 1fr)`,
                  gap: `${gridSettings.gap}px`,
                }}
              >
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(index)}
                    style={{ aspectRatio }}
                    className="relative group overflow-hidden cursor-move"
                  >
                    <img
                      src={item.linkUrl}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onDelete(item.id)}
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Input type="file" onChange={handleUpload} />
            </div>
          </ScrollArea>
          {settingsOpen && (
            <ScrollArea className="w-full max-w-md border-l p-4 h-full">
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto"
                  onClick={() => setSettingsOpen(false)}
                >
                  <XIcon className="w-4 h-4" />
                </Button>
                <div>
                  <Label className="mb-2 block">{t("fields.layout")}</Label>
                  <Select
                    value={gridSettings.layout}
                    onValueChange={(val) => onGridChange("layout", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("fields.layout")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid</SelectItem>
                      <SelectItem value="masonry">Masonry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">{t("fields.columns")}</Label>
                  <Input
                    type="number"
                    value={gridSettings.columns}
                    onChange={(e) => onGridChange("columns", e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">{t("fields.gap")}</Label>
                  <Input
                    type="number"
                    value={gridSettings.gap}
                    onChange={(e) => onGridChange("gap", e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">{t("fields.ratio")}</Label>
                  <Input
                    value={gridSettings.ratio}
                    onChange={(e) => onGridChange("ratio", e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </ScrollArea>
          )}
          {!settingsOpen && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4 z-10"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
