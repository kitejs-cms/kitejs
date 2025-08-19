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
} from "@kitejs-cms/dashboard-core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@kitejs-cms/dashboard-core/components/ui/dialog";
import { X, Settings2 } from "lucide-react";
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent position="full" className="h-full p-0 rounded-none">
        <div className="flex flex-col h-full">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>{t("title.editGallery")}</DialogTitle>
          </DialogHeader>
          <div className="relative flex flex-1">
            <div className="flex-1 p-4 overflow-auto">
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
                    style={{ aspectRatio: gridSettings.ratio }}
                    className="relative group overflow-hidden cursor-move"
                  >
                    <img
                      src={item.linkUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onDelete(item.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Input type="file" onChange={handleUpload} />
              </div>
            </div>
            {settingsOpen && (
              <div className="w-full max-w-md border-l p-4 overflow-y-auto space-y-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto"
                  onClick={() => setSettingsOpen(false)}
                >
                  <X className="w-4 h-4" />
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
            )}
            {!settingsOpen && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-4 right-4"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
