import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Badge } from "@kitejs-cms/dashboard-core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@kitejs-cms/dashboard-core/components/ui/dialog";
import { XIcon, UploadCloud } from "lucide-react";
import type {
  GallerySettingsModel,
  GalleryItemModel,
  Breakpoint,
  BreakpointSettingsModel,
} from "@kitejs-cms/gallery-plugin";
import { SettingsPanel } from "./settings-panel";
import { EditorToolbar, type PreviewMode } from "./editor-toolbar";
import { GridPreview } from "./grid-preview";

interface GalleryEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: GalleryItemModel[];
  settings: GallerySettingsModel;
  onUpload: (file: File) => void;
  onSort: (ids: string[]) => void;
  onDelete: (id: string) => void;
  onSettingsChange: (next: GallerySettingsModel) => void;
  onSave?: () => void;
}

function hasFilePayload(dt: DataTransfer | null): boolean {
  if (!dt) return false;
  const types: readonly string[] = Array.from(
    dt?.types as unknown as Iterable<string>
  );
  return types.includes("Files");
}

// --- helpers preview ---
const PREVIEW_WIDTH: Record<PreviewMode, number> = {
  desktop: 1200,
  tablet: 834,
  mobile: 390,
};

const PREVIEW_LABEL: Record<PreviewMode, string> = {
  desktop: "Desktop · ~1200px",
  tablet: "Tablet · ~834px",
  mobile: "Mobile · ~390px",
};

function effectiveRule(
  settings: GallerySettingsModel,
  preview: PreviewMode
): BreakpointSettingsModel {
  if (settings.mode === "responsive") {
    const bp = preview as Breakpoint; // 'desktop' | 'tablet' | 'mobile'
    const r = settings.responsive?.[bp] ?? { columns: 1, gap: 0 };
    return {
      columns: Math.max(1, r.columns || 1),
      gap: Math.max(0, r.gap || 0),
    };
  }
  const m = settings.manual ?? { columns: 1, gap: 0 };
  return { columns: Math.max(1, m.columns || 1), gap: Math.max(0, m.gap || 0) };
}

export function GalleryEditorModal({
  isOpen,
  onClose,
  items,
  settings,
  onUpload,
  onSort,
  onDelete,
  onSettingsChange,
  onSave,
}: GalleryEditorModalProps) {
  const [localItems, setLocalItems] = useState<GalleryItemModel[]>(items);
  const [localSettings, setLocalSettings] =
    useState<GallerySettingsModel>(settings);

  useEffect(() => setLocalItems(items), [isOpen, items]);
  useEffect(() => setLocalSettings(settings), [isOpen, settings]);

  const [settingsOpen, setSettingsOpen] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false);
  const [dirty, setDirty] = useState<boolean>(false);

  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const dragFilesDepth = useRef<number>(0);

  const markDirty = () => setDirty(true);

  useEffect(() => {
    const update = () => setIsSmallScreen(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const onDragEnter = (e: globalThis.DragEvent) => {
      if (hasFilePayload(e.dataTransfer ?? null)) {
        e.preventDefault();
        dragFilesDepth.current += 1;
        setIsDraggingFile(true);
      }
    };
    const onDragOver = (e: globalThis.DragEvent) => {
      if (hasFilePayload(e.dataTransfer ?? null)) {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      }
    };
    const onDragLeave = (e: globalThis.DragEvent) => {
      e.preventDefault();
      dragFilesDepth.current = Math.max(0, dragFilesDepth.current - 1);
      if (dragFilesDepth.current === 0) setIsDraggingFile(false);
    };
    const onDrop = (e: globalThis.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragFilesDepth.current = 0;
      setIsDraggingFile(false);
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  // preview mode + frame width
  const [preview, setPreview] = useState<PreviewMode>("desktop");
  const previewMaxWidth = useMemo<number>(
    () => PREVIEW_WIDTH[preview],
    [preview]
  );

  // su schermi piccoli, nascondi la preview quando il pannello è aperto
  const showPreview = !isSmallScreen || !settingsOpen;

  // file input per upload manuale
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      markDirty();
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  const handleBrowseClick = () => fileInputRef.current?.click();

  // calcolo regole effettive per preview corrente
  const { columns, gap } = effectiveRule(localSettings, preview);

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
            <div
              className="flex items-center gap-2 text-gray-500 hover:text-black transition cursor-pointer"
              aria-label="Chiudi (Esc)"
              title="Chiudi (Esc)"
            >
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
        <div className="relative flex flex-1 min-h-0 flex-col md:flex-row">
          {/* PREVIEW col */}
          {showPreview && (
            <div className="w-full justify-center flex">
              <div
                className="relative flex-1 min-h-0 p-4 max-w-7xl"
                onDragOver={(e) => {
                  e.preventDefault();
                  if (hasFilePayload(e.dataTransfer ?? null))
                    e.dataTransfer.dropEffect = "copy";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer?.files?.[0];
                  if (file) {
                    onUpload(file);
                    markDirty();
                  }
                  dragFilesDepth.current = 0;
                  setIsDraggingFile(false);
                }}
              >
                {/* input file nascosto */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleInputChange}
                  className="hidden"
                />

                {/* Toolbar integrata */}
                <EditorToolbar
                  preview={preview}
                  onPreviewChange={setPreview}
                  settingsOpen={settingsOpen}
                  onOpenSettings={() => setSettingsOpen(true)}
                  onBrowseClick={handleBrowseClick}
                />

                {/* overlay durante drag file */}
                {isDraggingFile && (
                  <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center rounded-md bg-white/80 text-gray-700">
                    <UploadCloud className="mb-3 h-12 w-12" />
                    <p className="text-lg font-semibold">
                      Rilascia per caricare
                    </p>
                    <p className="text-sm text-gray-600">
                      JPG, PNG, WEBP — max 25MB
                    </p>
                  </div>
                )}

                {/* Preview frame */}
                <div className="w-full h-full min-h-0">
                  <div
                    className="mx-auto border rounded-lg flex flex-col h-full max-h-[calc(100vh-220px)] min-h-0"
                    style={{ maxWidth: `${previewMaxWidth}px` }}
                  >
                    {/* bandella sempre visibile, anche in Desktop */}
                    <div className="h-6 w-full border-b bg-gray-50 rounded-t-lg flex items-center justify-center text-[10px] text-gray-500">
                      {PREVIEW_LABEL[preview]}
                    </div>

                    <div className="flex-1 p-4 overflow-auto">
                      {/* routing layout -> preview */}
                      {!localItems.length ? (
                        <div className="h-[60vh] flex flex-col items-center justify-center text-center gap-4 text-gray-600">
                          <UploadCloud className="w-10 h-10" />
                          <div className="space-y-1">
                            <p className="text-lg font-medium">
                              Galleria vuota
                            </p>
                            <p className="text-sm text-gray-500">
                              Trascina qui un’immagine oppure usa il pulsante in
                              alto
                            </p>
                          </div>
                        </div>
                      ) : localSettings.layout === "grid" ? (
                        <GridPreview
                          items={localItems}
                          columns={columns}
                          gap={gap}
                          disableItemDrag={isDraggingFile}
                          onReorder={(next) => {
                            setLocalItems(next);
                            markDirty();
                          }}
                          onDelete={(id) => {
                            onDelete(id);
                            setLocalItems((prev) =>
                              prev.filter((i) => i.id !== id)
                            );
                            markDirty();
                          }}
                        />
                      ) : (
                        <div className="border border-dashed rounded-md p-6 text-center text-sm text-gray-600">
                          <div className="font-medium mb-1">Slider Preview</div>
                          <div>Placeholder di test (implementazione WIP)</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS col */}
          {settingsOpen && (
            <SettingsPanel
              settings={localSettings}
              onChange={(next) => {
                setLocalSettings(next);
                onSettingsChange(next);
                markDirty();
              }}
              onClose={() => setSettingsOpen(false)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 left-0 right-0 border-t bg-white p-3 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Annulla
          </Button>
          <Button
            disabled={!dirty}
            onClick={() => {
              onSort(localItems.map((i) => i.id));
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
