import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent as ReactDragEvent,
} from "react";
import {
  Button,
  Label,
  Input,
  Badge,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@kitejs-cms/dashboard-core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@kitejs-cms/dashboard-core/components/ui/dialog";
import { ScrollArea } from "@kitejs-cms/dashboard-core/components/ui/scroll-area";
import {
  XIcon,
  Settings2,
  UploadCloud,
  Info,
  Monitor,
  Tablet,
  Smartphone,
  GripVertical,
} from "lucide-react";
import type { GalleryItemModel } from "@kitejs-cms/gallery-plugin";

type Item = GalleryItemModel & { id: string };

interface GridSettings {
  columns: string; // numerico in string
  gap: string; // numerico in string (px)
}

type PreviewMode = "desktop" | "tablet" | "mobile";

interface BreakpointRule {
  columns: number;
  gap: number; // px
}
type ResponsiveRules = Record<PreviewMode, BreakpointRule>;

interface GalleryEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  gridSettings: GridSettings;
  onUpload: (file: File) => void;
  onSort: (ids: string[]) => void;
  onDelete: (id: string) => void;
  onGridChange: (field: keyof GridSettings, value: string) => void;
  onSave?: () => void;
}

const DEFAULT_RULES: ResponsiveRules = {
  desktop: { columns: 4, gap: 16 },
  tablet: { columns: 2, gap: 12 },
  mobile: { columns: 1, gap: 8 },
};

function hasFilePayload(dt: DataTransfer | null): boolean {
  if (!dt) return false;
  const types: readonly string[] = Array.from(
    dt?.types as unknown as Iterable<string>
  );
  return types.includes("Files");
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
  const [settingsOpen, setSettingsOpen] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false);
  const [dirty, setDirty] = useState<boolean>(false);

  // Anteprima dispositivi
  const [preview, setPreview] = useState<PreviewMode>("tablet");
  const previewMaxWidth = useMemo<number>(() => {
    switch (preview) {
      case "mobile":
        return 390;
      case "tablet":
        return 834;
      default:
        return 1200;
    }
  }, [preview]);

  // Regole responsive
  const [useResponsive, setUseResponsive] = useState<boolean>(true);
  const [rules, setRules] = useState<ResponsiveRules>(DEFAULT_RULES);

  // DnD upload globale
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const dragFilesDepth = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const markDirty = () => setDirty(true);

  useEffect(() => {
    const update = () => setIsSmallScreen(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Upload (input)
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      markDirty();
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  const handleBrowseClick = (): void => fileInputRef.current?.click();

  // Reorder (drag sugli item)
  const handleDragStart = (idx: number): void => setDragIndex(idx);
  const handleDropReorder = (
    e: ReactDragEvent<HTMLDivElement>,
    idx: number
  ): void => {
    e.preventDefault();
    e.stopPropagation();
    if (dragIndex === null || dragIndex === idx) return;
    const reordered = [...items];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(idx, 0, moved);
    onSort(reordered.map((i) => i.id));
    setDragIndex(null);
    markDirty();
  };

  // Upload (drop)
  const handleDropUpload = (e: ReactDragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUpload(file);
      markDirty();
    }
    dragFilesDepth.current = 0;
    setIsDraggingFile(false);
  };

  // Overlay globale
  useEffect(() => {
    const onDragEnter = (e: globalThis.DragEvent) => {
      if (hasFilePayload(e.dataTransfer ?? null)) {
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
    const onDragLeave = () => {
      dragFilesDepth.current = Math.max(0, dragFilesDepth.current - 1);
      if (dragFilesDepth.current === 0) setIsDraggingFile(false);
    };
    const onDrop = () => {
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

  // Valori effettivi per la preview: responsive oppure manuali
  const effectiveColumns = useMemo<number>(() => {
    if (useResponsive) {
      const col = rules[preview].columns;
      return Math.max(1, col);
    }
    return Math.max(1, Number(gridSettings.columns) || 1);
  }, [useResponsive, rules, preview, gridSettings.columns]);

  const effectiveGapPx = useMemo<string>(() => {
    if (useResponsive) {
      const g = Math.max(0, rules[preview].gap);
      return `${g}px`;
    }
    return `${Math.max(0, Number(gridSettings.gap) || 0)}px`;
  }, [useResponsive, rules, preview, gridSettings.gap]);

  // Helpers UI rules
  const handleRuleChange = (
    bp: PreviewMode,
    field: keyof BreakpointRule,
    value: string
  ): void => {
    const parsed = Math.max(0, Number(value) || 0);
    setRules((prev) => ({
      ...prev,
      [bp]: { ...prev[bp], [field]: parsed },
    }));
  };

  // Nascondi controlli su mobile quando il pannello impostazioni è aperto
  const hideTopControls = isSmallScreen && settingsOpen;

  // Classi/composizioni utili
  const toolbarWrapperClass = isSmallScreen
    ? "mb-3 w-full flex items-center justify-between gap-2"
    : "absolute top-4 right-4 flex items-center gap-2";

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
          {/* PREVIEW */}
          <div
            className="relative flex-1 min-h-0 p-4"
            onDragOver={(e: ReactDragEvent<HTMLDivElement>) => {
              e.preventDefault();
              if (hasFilePayload(e.dataTransfer ?? null))
                e.dataTransfer.dropEffect = "copy";
            }}
            onDrop={handleDropUpload}
            aria-label="Area anteprima galleria. Trascina un file per caricarlo oppure riordina gli elementi."
          >
            {/* input file nascosto per 'Scegli file' */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleInputChange}
              className="hidden"
            />

            {/* Toolbar anteprima (tabs device + settings toggle su mobile) */}
            {!hideTopControls && (
              <div className={toolbarWrapperClass}>
                <Tabs
                  value={preview}
                  onValueChange={(value) => setPreview(value as PreviewMode)}
                >
                  <TabsList className="flex-wrap h-auto">
                    <TabsTrigger value="desktop" className="text-sm">
                      <Monitor className="w-4 h-4" />
                    </TabsTrigger>
                    <TabsTrigger
                      aria-label="Anteprima tablet"
                      value="tablet"
                      className="text-sm"
                    >
                      <Tablet className="w-4 h-4" />
                    </TabsTrigger>
                    <TabsTrigger
                      aria-label="Anteprima mobile"
                      value="mobile"
                      className="text-sm"
                    >
                      <Smartphone className="w-4 h-4" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {isSmallScreen && !settingsOpen && (
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setSettingsOpen(true)}
                    title="Apri impostazioni"
                    aria-label="Apri impostazioni"
                  >
                    <Settings2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}

            {/* Overlay globale */}
            {isDraggingFile && (
              <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center rounded-md bg-white/80 text-gray-700">
                <UploadCloud className="mb-3 h-12 w-12" />
                <p className="text-lg font-semibold">Rilascia per caricare</p>
                <p className="text-sm text-gray-600">
                  JPG, PNG, WEBP — max 25MB
                </p>
              </div>
            )}

            {/* Banner d’aiuto — ORA rimosso dal DOM quando hideTopControls=true */}
            {!hideTopControls && (
              <div
                className="mb-3 inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs text-gray-600"
                style={{ borderColor: "#e5e7eb" }}
              >
                <UploadCloud className="w-4 h-4" />
                <span className="font-medium">Trascina qui per caricare</span>
                <span className="opacity-70">oppure</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBrowseClick}
                  className="h-7"
                  aria-label="Scegli file"
                >
                  Scegli file
                </Button>
                <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-gray-500">
                  <Info className="w-3 h-3" /> supporta JPG/PNG/WEBP
                </span>
                {items.length > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-gray-500">
                    <GripVertical className="w-3 h-3" /> riordina trascinando
                  </span>
                )}
              </div>
            )}

            {/* Canvas con larghezza fissa per device - SCROLL FIX */}
            <div className="w-full h-full min-h-0">
              <div
                className="mx-auto border rounded-lg flex flex-col h-full max-h-[calc(100vh-220px)] min-h-0"
                style={{ maxWidth: `${previewMaxWidth}px` }}
              >
                {/* Intestazione device: visibile solo quando !hideTopControls */}
                {(preview === "mobile" || preview === "tablet") &&
                  !hideTopControls && (
                    <div className="h-6 w-full border-b bg-gray-50 rounded-t-lg flex items-center justify-center text-[10px] text-gray-500">
                      {preview === "mobile"
                        ? "Mobile · ~390px"
                        : "Tablet · ~834px"}
                    </div>
                  )}

                <ScrollArea className="flex-1 p-4 h-full pb-8">
                  {items.length === 0 ? (
                    <div className="h-[60vh] flex flex-col items-center justify-center text-center gap-4 text-gray-600">
                      <UploadCloud className="w-10 h-10" />
                      <div className="space-y-1">
                        <p className="text-lg font-medium">Galleria vuota</p>
                        <p className="text-sm text-gray-500">
                          Trascina qui un’immagine oppure usa il pulsante a
                          destra
                        </p>
                      </div>
                      <Button onClick={handleBrowseClick}>
                        Carica immagine
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="[&>*]:mb-4"
                      style={{
                        columnCount: effectiveColumns,
                        columnGap: effectiveGapPx,
                      }}
                    >
                      {items.map((item, index) => (
                        <div
                          key={item.id}
                          draggable={!isDraggingFile}
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e: ReactDragEvent<HTMLDivElement>) => {
                            e.preventDefault();
                            if (hasFilePayload(e.dataTransfer ?? null)) {
                              e.dataTransfer.dropEffect = "copy";
                            } else {
                              e.dataTransfer.dropEffect = "move";
                            }
                          }}
                          onDragEnd={() => setDragIndex(null)}
                          onDrop={(e: ReactDragEvent<HTMLDivElement>) => {
                            if (e.dataTransfer.files?.length) {
                              handleDropUpload(e);
                            } else {
                              handleDropReorder(e, index);
                            }
                          }}
                          className={`relative group overflow-hidden mb-4 break-inside-avoid transition-shadow ${
                            dragIndex === index
                              ? "cursor-grabbing"
                              : "cursor-grab"
                          } shadow-sm hover:shadow-lg`}
                          aria-label="Elemento galleria. Trascina per riordinare."
                          title="Trascina per riordinare. Trascina un file per caricare."
                        >
                          <div className="pointer-events-none absolute top-2 left-2 z-10 rounded-md bg-black/50 p-1 text-white">
                            <GripVertical className="w-3 h-3" />
                          </div>
                          <img
                            src={item.linkUrl}
                            alt=""
                            className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.02]"
                            draggable={false}
                          />
                          <Button
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                            onClick={() => {
                              onDelete(item.id);
                              markDirty();
                            }}
                            aria-label="Elimina immagine"
                            title="Elimina"
                          >
                            <XIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </div>

          {/* RIGHT: impostazioni + upload */}
          {settingsOpen && (
            <div className="relative w-full md:max-w-md md:border-l border-t md:border-t-0 h-full min-h-0">
              <ScrollArea className="p-4 h-full min-h-0">
                <div className="space-y-6">
                  {/* Header impostazioni */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Impostazioni</p>
                      <p className="text-xs text-gray-500">Layout galleria</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => setSettingsOpen(false)}
                        title="Chiudi impostazioni"
                        aria-label="Chiudi impostazioni"
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="h-px bg-gray-200" />

                  {/* Toggle regole responsive */}
                  <div className="space-y-2">
                    <Label className="block text-sm font-medium">
                      Regole responsive di default
                    </Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="use-responsive"
                        checked={useResponsive}
                        onCheckedChange={setUseResponsive}
                      />
                      <Label
                        htmlFor="use-responsive"
                        className="text-sm text-gray-600"
                      >
                        Applica colonne/gap automatici per Desktop/Tablet/Mobile
                      </Label>
                    </div>
                  </div>

                  {/* Editor regole per breakpoint */}
                  <div className="grid grid-cols-3 gap-4">
                    {(["desktop", "tablet", "mobile"] as PreviewMode[]).map(
                      (bp) => (
                        <div key={bp} className="rounded-lg border p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase text-gray-600">
                              {bp === "desktop"
                                ? "Desktop"
                                : bp === "tablet"
                                  ? "Tablet"
                                  : "Mobile"}
                            </span>
                            {bp === "desktop" ? (
                              <Monitor className="w-4 h-4" />
                            ) : bp === "tablet" ? (
                              <Tablet className="w-4 h-4" />
                            ) : (
                              <Smartphone className="w-4 h-4" />
                            )}
                          </div>
                          <Label className="mb-1 block text-xs">Colonne</Label>
                          <Input
                            type="number"
                            min={1}
                            value={rules[bp].columns}
                            onChange={(e) => {
                              handleRuleChange(bp, "columns", e.target.value);
                            }}
                            inputMode="numeric"
                          />
                          <Label className="mt-2 mb-1 block text-xs">
                            Gap (px)
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            value={rules[bp].gap}
                            onChange={(e) => {
                              handleRuleChange(bp, "gap", e.target.value);
                            }}
                            inputMode="numeric"
                          />
                        </div>
                      )
                    )}
                  </div>

                  <div className="h-px bg-gray-200" />

                  {/* Impostazioni manuali (quando il toggle è OFF) */}
                  <div
                    className={`${useResponsive ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    <Label className="mb-2 block">Colonne (manuale)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={gridSettings.columns}
                      onChange={(e) => {
                        onGridChange("columns", e.target.value);
                        markDirty();
                      }}
                      inputMode="numeric"
                    />
                    <Label className="mt-3 mb-2 block">
                      Spazio (px) (manuale)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={gridSettings.gap}
                      onChange={(e) => {
                        onGridChange("gap", e.target.value);
                        markDirty();
                      }}
                      inputMode="numeric"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      I valori manuali vengono usati solo se disattivi le regole
                      responsive di default.
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Toggle pannello impostazioni DESKTOP ONLY (su mobile è nella toolbar) */}
          {!isSmallScreen && !settingsOpen && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-16 right-4 z-10"
              onClick={() => setSettingsOpen(true)}
              title="Apri impostazioni"
              aria-label="Apri impostazioni"
            >
              <Settings2 className="w-4 h-4" />
            </Button>
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
