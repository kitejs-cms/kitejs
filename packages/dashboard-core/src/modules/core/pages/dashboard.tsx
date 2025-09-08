import { useEffect, useState } from "react";
import { DashboardWidgetModel } from "../../../models/dashboard-widget.model";
import { useSettingsContext } from "../../../context/settings-context";
import {
  DashboardWidgetLayout,
  DashboardWidgetsSettingsModel,
} from "../../../models/dashboard-widgets-settings.model";
import { Button } from "../../../components/ui/button";
import {
  ArrowLeftRight,
  ArrowUpDown,
  Check,
  GripVertical,
  Plus,
  Settings,
  X,
} from "lucide-react";

interface DashboardPageProps {
  widgets?: DashboardWidgetModel[];
}

export function DashboardPage({ widgets = [] }: DashboardPageProps) {
  const { getSetting, updateSetting } = useSettingsContext();
  const [layout, setLayout] = useState<DashboardWidgetLayout[]>([]);
  const [originalLayout, setOriginalLayout] = useState<
    DashboardWidgetLayout[]
  >([]);
  const [editing, setEditing] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const stored = await getSetting<{ value: DashboardWidgetsSettingsModel }>(
        "dashboard",
        "dashboard:widgets"
      );

      if (stored?.value?.widgets?.length) {
        setLayout(
          stored.value.widgets.map((w) => ({
            ...w,
            height: w.height ?? 1,
          }))
        );
      } else {
        setLayout(
          widgets.map((w) => ({
            key: w.key,
            width: w.defaultWidth ?? 1,
            height: w.defaultHeight ?? 1,
          }))
        );
      }
    })();
  }, [getSetting, widgets]);

  const widgetMap = new Map(widgets.map((w) => [w.key, w]));
  const displayed = layout.filter((l) => widgetMap.has(l.key));
  const available = widgets.filter(
    (w) => !layout.some((l) => l.key === w.key)
  );

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const newLayout = [...layout];
    const [moved] = newLayout.splice(draggedIndex, 1);
    newLayout.splice(index, 0, moved);
    setLayout(newLayout);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleRemove = (key: string) => {
    setLayout(layout.filter((l) => l.key !== key));
  };

  const handleAdd = (key: string) => {
    const widget = widgetMap.get(key);
    setLayout([
      ...layout,
      { key, width: widget?.defaultWidth ?? 1, height: widget?.defaultHeight ?? 1 },
    ]);
  };

  const handleWidthChange = (key: string, width: number) => {
    setLayout(layout.map((l) => (l.key === key ? { ...l, width } : l)));
  };

  const handleHeightChange = (key: string, height: number) => {
    setLayout(layout.map((l) => (l.key === key ? { ...l, height } : l)));
  };

  const cycleWidth = (key: string) => {
    const item = layout.find((l) => l.key === key);
    if (!item) return;
    const newWidth = item.width === 3 ? 1 : item.width + 1;
    handleWidthChange(key, newWidth);
  };

  const cycleHeight = (key: string) => {
    const item = layout.find((l) => l.key === key);
    if (!item) return;
    const newHeight = item.height === 2 ? 1 : 2;
    handleHeightChange(key, newHeight);
  };

  const handleSave = async () => {
    await updateSetting("dashboard", "dashboard:widgets", {
      widgets: layout,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setLayout(originalLayout);
    setEditing(false);
  };

  const totalCells = displayed.reduce(
    (sum, item) => sum + item.width * item.height,
    0
  );
  const placeholderCount = (Math.ceil(totalCells / 3) + 1) * 3 - totalCells;

  return (
    <div className="flex h-full w-full flex-col p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Benvenuto nel pannello di controllo. Gestisci i tuoi contenuti e
            utenti.
          </p>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              aria-label="Annulla"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSave}
              aria-label="Conferma"
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setOriginalLayout(layout.map((l) => ({ ...l })));
              setEditing(true);
            }}
            aria-label="Personalizza"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>

      {displayed.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-[200px] gap-6 relative">
          {displayed.map((layoutItem, index) => {
            const widget = widgetMap.get(layoutItem.key)!;
            const isDragOver = dragOverIndex === index;
            const widthClass =
              layoutItem.width === 3
                ? "col-span-1 md:col-span-2 lg:col-span-3"
                : layoutItem.width === 2
                ? "col-span-1 md:col-span-2"
                : "col-span-1";
            const heightClass =
              layoutItem.height === 2 ? "row-span-2" : "row-span-1";
            return (
              <div
                key={layoutItem.key}
                className={`relative h-full ${heightClass} ${widthClass} ${
                  editing ? "border-2 border-dashed" : ""
                } ${isDragOver ? "border-primary" : "border-transparent"}`}
                draggable={editing}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverIndex(index);
                }}
                onDragLeave={() => setDragOverIndex(null)}
                onDrop={() => handleDrop(index)}
              >
                {editing && (
                  <>
                    <div className="absolute top-2 left-2 z-10 text-muted-foreground cursor-move">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="absolute top-2 right-2 z-10 flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => cycleWidth(layoutItem.key)}
                      >
                        <ArrowLeftRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => cycleHeight(layoutItem.key)}
                      >
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(layoutItem.key)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
                <div className={editing ? "pointer-events-none h-full" : "h-full"}>
                  {widget.component}
                </div>
              </div>
            );
          })}
          {editing &&
            Array.from({ length: placeholderCount }).map((_, i) => (
              <div
                key={`placeholder-${i}`}
                className="border-2 border-dashed border-muted-foreground/20"
              />
            ))}
        </div>
      )}

      {editing && available.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Widget disponibili</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-[200px] gap-6">
            {available.map((w) => {
              const heightClass =
                w.defaultHeight === 2 ? "row-span-2" : "row-span-1";
              return (
                <div
                  key={w.key}
                  className={`relative border-2 border-dashed ${heightClass}`}
                >
                  <div className="pointer-events-none opacity-50">
                    {w.component}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleAdd(w.key)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
