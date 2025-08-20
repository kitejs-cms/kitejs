import { useRef, useState, type ChangeEvent } from "react";
import { Button, Label, Input, Badge } from "@kitejs-cms/dashboard-core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@kitejs-cms/dashboard-core/components/ui/dialog";
import { ScrollArea } from "@kitejs-cms/dashboard-core/components/ui/scroll-area";
import { XIcon, Settings2, UploadCloud } from "lucide-react";
import type { GalleryItemModel } from "@kitejs-cms/gallery-plugin";

interface Item extends GalleryItemModel {
  id: string;
}

interface GridSettings {
  columns: string; // numero colonne
  gap: string; // gap in px
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
  onSave?: () => void; // opzionale: callback Salva
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
  onSave,
}: GalleryEditorModalProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [dirty, setDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const markDirty = () => setDirty(true);

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      markDirty();
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBrowseClick = () => fileInputRef.current?.click();

  const handleDragStart = (idx: number) => setDragIndex(idx);
  const handleDropReorder = (idx: number) => {
    if (dragIndex === null || dragIndex === idx) return;
    const reordered = [...items];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(idx, 0, moved);
    onSort(reordered.map((i) => i.id));
    setDragIndex(null);
    markDirty();
  };

  const handleDropUpload = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUpload(file);
      markDirty();
    }
  };

  // Valori di fallback richiesti: 1 colonna e 0 spazio
  const columns = Math.max(1, Number(gridSettings.columns) || 1);
  const gapPx = `${Math.max(0, Number(gridSettings.gap) || 0)}px`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        position="full"
        className="p-0 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <DialogHeader className="flex flex-row justify-between items-center p-4 border-b shrink-0">
          <DialogTitle className="text-xl font-semibold">
            Modifica galleria
          </DialogTitle>
          <DialogClose asChild>
            <div className="flex items-center gap-2 text-gray-500 hover:text-black transition cursor-pointer">
              <Badge
                variant="outline"
                className="bg-gray-100 text-gray-500 border-gray-300 font-medium px-2 py-0.5"
              >
                Esc
              </Badge>
              <XIcon className="w-5 h-5" />
            </div>
          </DialogClose>
        </DialogHeader>

        {/* Body */}
        <div className="relative flex flex-1 pb-20">
          {/* pb per non coprire dal footer fisso */}
          {/* Preview area */}
          <ScrollArea className="flex-1 p-4">
            {items.length === 0 ? (
              // EMPTY STATE (nessun bordo arrotondato)
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropUpload}
                className="h-[70vh] border-2 border-dashed flex flex-col items-center justify-center text-center gap-4"
                style={{ borderColor: "#e5e7eb" }}
              >
                <UploadCloud className="w-10 h-10" />
                <div className="space-y-1">
                  <p className="text-lg font-medium">Galleria vuota</p>
                  <p className="text-sm text-gray-500">
                    Trascina qui un'immagine oppure usa il pulsante a destra
                  </p>
                </div>
                <Button onClick={handleBrowseClick}>Carica immagine</Button>
              </div>
            ) : (
              // MASONRY (stile Unsplash): colonne, nessun stretch, nessun bordo arrotondato
              <div
                className="[&>*]:mb-4"
                style={{ columnCount: columns, columnGap: gapPx }}
              >
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropReorder(index)}
                    className="relative group overflow-hidden mb-4 break-inside-avoid cursor-move shadow-sm hover:shadow-lg transition-shadow"
                  >
                    <img
                      src={item.linkUrl}
                      alt=""
                      className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        onDelete(item.id);
                        markDirty();
                      }}
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Right settings + upload */}
          {settingsOpen && (
            <ScrollArea className="w-full max-w-md border-l p-4 h-full">
              <div className="space-y-4">
                {/* Upload nella colonna destra */}
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Aggiungi media</p>
                    <p className="text-xs text-gray-500">
                      Trascina nella preview o clicca qui sotto
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleUpload}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleBrowseClick}
                    >
                      <UploadCloud className="w-4 h-4 mr-2" />
                      Carica
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-1"
                      onClick={() => setSettingsOpen(false)}
                      title="Chiudi impostazioni"
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="h-px bg-gray-200" />

                {/* Impostazioni (solo colonne e gap) */}
                <div>
                  <Label className="mb-2 block">Colonne</Label>
                  <Input
                    type="number"
                    min={1}
                    value={gridSettings.columns}
                    onChange={(e) => {
                      onGridChange("columns", e.target.value);
                      markDirty();
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Spazio</Label>
                  <Input
                    type="number"
                    min={0}
                    value={gridSettings.gap}
                    onChange={(e) => {
                      onGridChange("gap", e.target.value);
                      markDirty();
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            </ScrollArea>
          )}

          {/* Re-open settings */}
          {!settingsOpen && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4 z-10"
              onClick={() => setSettingsOpen(true)}
              title="Apri impostazioni"
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Footer fisso */}
        <div className="sticky bottom-0 left-0 right-0 border-t bg-white p-3 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Annulla
          </Button>
          <Button
            disabled={!dirty}
            onClick={() => {
              onSave?.();
              setDirty(false);
            }}
          >
            Salva
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
