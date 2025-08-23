import { ScrollArea } from "@kitejs-cms/dashboard-core/components/ui/scroll-area";
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
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@kitejs-cms/dashboard-core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@kitejs-cms/dashboard-core/components/ui/dialog";
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
import type {
  GallerySettingsModel,
  GalleryItemModel,
  Breakpoint,
  BreakpointSettingsModel,
  GalleryLayout,
  GalleryMode,
} from "@kitejs-cms/gallery-plugin";

enum PreviewMode {
  Desktop = "desktop",
  Tablet = "tablet",
  Mobile = "mobile",
}

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

  useEffect(() => {
    setLocalItems(items);
  }, [isOpen, items]);

  useEffect(() => {
    setLocalSettings(settings);
  }, [isOpen, settings]);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false);
  const [dirty, setDirty] = useState<boolean>(false);

  const [preview, setPreview] = useState<PreviewMode>(PreviewMode.Desktop);
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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      markDirty();
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  const handleBrowseClick = (): void => fileInputRef.current?.click();

  const handleDragStart = (
    idx: number,
    e?: ReactDragEvent<HTMLDivElement>
  ): void => {
    setDragIndex(idx);
    setHoverIndex(idx);
    if (e?.dataTransfer) {
      try {
        e.dataTransfer.setData("text/plain", String(idx));
      } catch {
        /* empty */
      }
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const handleDropReorder = (
    e: ReactDragEvent<HTMLDivElement>,
    idx: number
  ): void => {
    e.preventDefault();
    e.stopPropagation();
    if (dragIndex === null || dragIndex === idx) {
      setHoverIndex(null);
      setDragIndex(null);
      return;
    }
    setLocalItems((prev) => {
      const reordered = [...prev];
      const [moved] = reordered.splice(dragIndex, 1);
      reordered.splice(idx, 0, moved);
      return reordered;
    });
    setDragIndex(null);
    setHoverIndex(null);
    markDirty();
  };

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
    setHoverIndex(null);
    setDragIndex(null);
  };

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

  // ---- helpers settings (allineati ai nuovi modelli)
  const currentMode: GalleryMode = localSettings.mode;
  const currentLayout: GalleryLayout = localSettings.layout;
  const ratio = localSettings.ratio;

  const getBp = (bp: Breakpoint): BreakpointSettingsModel => {
    // fallback sicuro per evitare undefined negli input
    if (currentMode === "responsive") {
      return (
        localSettings.responsive?.[bp] ?? {
          columns: 1,
          gap: 0,
        }
      );
    }
    // in manual mode, usiamo i valori manuali per tutti i breakpoint
    return localSettings.manual ?? { columns: 1, gap: 0 };
  };

  const setResponsiveBp = (
    bp: Breakpoint,
    patch: Partial<BreakpointSettingsModel>
  ) => {
    setLocalSettings((prev) => {
      const next: GallerySettingsModel = {
        ...prev,
        mode: "responsive",
        responsive: {
          desktop: prev.responsive?.desktop ?? { columns: 3, gap: 16 },
          tablet: prev.responsive?.tablet ?? { columns: 2, gap: 12 },
          mobile: prev.responsive?.mobile ?? { columns: 1, gap: 8 },
        },
      };
      next.responsive![bp] = {
        ...next.responsive![bp],
        ...patch,
      };
      markDirty();
      onSettingsChange(next);
      return next;
    });
  };

  const setManual = (patch: Partial<BreakpointSettingsModel>) => {
    setLocalSettings((prev) => {
      const next: GallerySettingsModel = {
        ...prev,
        mode: "manual",
        manual: {
          columns: prev.manual?.columns ?? 3,
          gap: prev.manual?.gap ?? 16,
          ...patch,
        },
      };
      markDirty();
      onSettingsChange(next);
      return next;
    });
  };

  const setMode = (mode: GalleryMode) => {
    setLocalSettings((prev) => {
      const next: GallerySettingsModel = { ...prev, mode };
      // garantisci strutture minime
      if (mode === "responsive") {
        next.responsive = {
          desktop: prev.responsive?.desktop ?? { columns: 3, gap: 16 },
          tablet: prev.responsive?.tablet ?? { columns: 2, gap: 12 },
          mobile: prev.responsive?.mobile ?? { columns: 1, gap: 8 },
        };
      } else {
        next.manual = prev.manual ?? { columns: 3, gap: 16 };
      }
      markDirty();
      onSettingsChange(next);
      return next;
    });
  };

  const setLayout = (layout: GalleryLayout) => {
    setLocalSettings((prev) => {
      const next = { ...prev, layout };
      markDirty();
      onSettingsChange(next);
      return next;
    });
  };

  const setRatio = (value: string) => {
    setLocalSettings((prev) => {
      const next = { ...prev, ratio: value };
      markDirty();
      onSettingsChange(next);
      return next;
    });
  };

  const effectiveColumns = useMemo<number>(() => {
    const bp = preview as Breakpoint;
    return Math.max(1, getBp(bp).columns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, localSettings]);

  const effectiveGapPx = useMemo<string>(() => {
    const bp = preview as Breakpoint;
    return `${Math.max(0, getBp(bp).gap)}px`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, localSettings]);

  const hideTopControls = isSmallScreen && settingsOpen;
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
              else e.dataTransfer.dropEffect = "move";
            }}
            onDrop={handleDropUpload}
            aria-label="Area anteprima galleria. Trascina un file per caricarlo oppure riordina gli elementi."
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleInputChange}
              className="hidden"
            />

            {!hideTopControls && (
              <div className={toolbarWrapperClass}>
                <Tabs
                  value={preview}
                  onValueChange={(v) => setPreview(v as PreviewMode)}
                >
                  <TabsList className="flex-wrap h-auto">
                    <TabsTrigger value="desktop" className="text-sm">
                      <Monitor className="w-4 h-4" />
                    </TabsTrigger>
                    <TabsTrigger value="tablet" className="text-sm">
                      <Tablet className="w-4 h-4" />
                    </TabsTrigger>
                    <TabsTrigger value="mobile" className="text-sm">
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

            {isDraggingFile && (
              <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center rounded-md bg-white/80 text-gray-700">
                <UploadCloud className="mb-3 h-12 w-12" />
                <p className="text-lg font-semibold">Rilascia per caricare</p>
                <p className="text-sm text-gray-600">
                  JPG, PNG, WEBP — max 25MB
                </p>
              </div>
            )}

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
              </div>
            )}

            <div className="w-full h-full min-h-0">
              <div
                className="mx-auto border rounded-lg flex flex-col h-full max-h-[calc(100vh-220px)] min-h-0"
                style={{ maxWidth: `${previewMaxWidth}px` }}
              >
                {(preview === "mobile" || preview === "tablet") &&
                  !hideTopControls && (
                    <div className="h-6 w-full border-b bg-gray-50 rounded-t-lg flex items-center justify-center text-[10px] text-gray-500">
                      {preview === "mobile"
                        ? "Mobile · ~390px"
                        : "Tablet · ~834px"}
                    </div>
                  )}

                <ScrollArea className="flex-1 p-4 h-full pb-8">
                  {localItems.length === 0 ? (
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
                      {localItems.map((item, index) => (
                        <div key={item.id} className="break-inside-avoid">
                          {/* slot placeholder prima dell'elemento durante il drag */}
                          {dragIndex !== null && hoverIndex === index && (
                            <div
                              className="mb-4 h-8 rounded-md border-2 border-dashed"
                              aria-hidden
                            />
                          )}

                          <div
                            draggable={!isDraggingFile}
                            onDragStart={(e) => handleDragStart(index, e)}
                            onDragOver={(e: ReactDragEvent<HTMLDivElement>) => {
                              e.preventDefault();
                              if (hasFilePayload(e.dataTransfer ?? null)) {
                                e.dataTransfer.dropEffect = "copy";
                              } else {
                                e.dataTransfer.dropEffect = "move";
                                setHoverIndex(index);
                              }
                            }}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              if (!hasFilePayload(e.dataTransfer ?? null))
                                setHoverIndex(index);
                            }}
                            onDragEnd={() => {
                              setDragIndex(null);
                              setHoverIndex(null);
                            }}
                            onDrop={(e: ReactDragEvent<HTMLDivElement>) => {
                              if (e.dataTransfer.files?.length)
                                handleDropUpload(e);
                              else handleDropReorder(e, index);
                            }}
                            className={`relative group overflow-hidden mb-4 transition-shadow ${
                              dragIndex === index
                                ? "cursor-grabbing"
                                : "cursor-grab"
                            } shadow-sm hover:shadow-lg ${
                              hoverIndex === index && dragIndex !== null
                                ? "ring-2 ring-offset-2"
                                : ""
                            }`}
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
                                setLocalItems((prev) =>
                                  prev.filter((i) => i.id !== item.id)
                                );
                                markDirty();
                              }}
                              aria-label="Elimina immagine"
                              title="Elimina"
                            >
                              <XIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {dragIndex !== null &&
                        hoverIndex === localItems.length && (
                          <div
                            className="mb-4 h-8 rounded-md border-2 border-dashed"
                            aria-hidden
                          />
                        )}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </div>

          {/* SETTINGS */}
          {settingsOpen && (
            <div className="relative w-full md:max-w-md md:border-l border-t md:border-t-0 h-full min-h-0">
              <ScrollArea className="p-4 h-full min-h-0">
                <div className="space-y-6">
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

                  {/* layout */}
                  <div className="space-y-2">
                    <Label className="block text-sm font-medium">Layout</Label>
                    <Select
                      value={currentLayout}
                      onValueChange={(v) => setLayout(v as GalleryLayout)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona layout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="masonry">Masonry</SelectItem>
                        <SelectItem value="slider">Slider</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ratio */}
                  <div className="space-y-2">
                    <Label className="block text-sm font-medium">
                      Ratio (es. 16:9, 4:3) — lascia vuoto per auto
                    </Label>
                    <Input
                      value={ratio ?? ""}
                      onChange={(e) => setRatio(e.target.value)}
                      placeholder="es. 16:9"
                    />
                  </div>

                  <div className="h-px bg-gray-200" />

                  {/* mode */}
                  <div className="space-y-2">
                    <Label className="block text-sm font-medium">
                      Modalità colonne/gap
                    </Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="mode-switch"
                        checked={currentMode === "responsive"}
                        onCheckedChange={(checked) =>
                          setMode(checked ? "responsive" : "manual")
                        }
                      />
                      <Label
                        htmlFor="mode-switch"
                        className="text-sm text-gray-600"
                      >
                        {currentMode === "responsive"
                          ? "Responsive per Desktop/Tablet/Mobile"
                          : "Manuale (valori unici)"}
                      </Label>
                    </div>
                  </div>

                  {/* responsive controls */}
                  <div
                    className={`${currentMode !== "responsive" ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    <div className="grid grid-cols-3 gap-4">
                      {(["desktop", "tablet", "mobile"] as Breakpoint[]).map(
                        (bp) => {
                          const icon =
                            bp === "desktop" ? (
                              <Monitor className="w-4 h-4" />
                            ) : bp === "tablet" ? (
                              <Tablet className="w-4 h-4" />
                            ) : (
                              <Smartphone className="w-4 h-4" />
                            );
                          const v = getBp(bp);
                          return (
                            <div key={bp} className="rounded-lg border p-3">
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase text-gray-600">
                                  {bp === "desktop"
                                    ? "Desktop"
                                    : bp === "tablet"
                                      ? "Tablet"
                                      : "Mobile"}
                                </span>
                                {icon}
                              </div>
                              <Label className="mb-1 block text-xs">
                                Colonne
                              </Label>
                              <Input
                                type="number"
                                min={1}
                                value={v.columns}
                                onChange={(e) =>
                                  setResponsiveBp(bp, {
                                    columns: Math.max(
                                      1,
                                      Number(e.target.value) || 1
                                    ),
                                  })
                                }
                                inputMode="numeric"
                              />
                              <Label className="mt-2 mb-1 block text-xs">
                                Gap (px)
                              </Label>
                              <Input
                                type="number"
                                min={0}
                                value={v.gap}
                                onChange={(e) =>
                                  setResponsiveBp(bp, {
                                    gap: Math.max(
                                      0,
                                      Number(e.target.value) || 0
                                    ),
                                  })
                                }
                                inputMode="numeric"
                              />
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* manual controls */}
                  <div
                    className={`${currentMode !== "manual" ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    <Label className="mb-2 block">Colonne (manuale)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={localSettings.manual?.columns ?? 3}
                      onChange={(e) =>
                        setManual({
                          columns: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      inputMode="numeric"
                    />
                    <Label className="mt-3 mb-2 block">
                      Spazio (px) (manuale)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={localSettings.manual?.gap ?? 16}
                      onChange={(e) =>
                        setManual({
                          gap: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      inputMode="numeric"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      I valori manuali vengono usati per tutti i breakpoint
                      quando la modalità è “Manuale”.
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}

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
