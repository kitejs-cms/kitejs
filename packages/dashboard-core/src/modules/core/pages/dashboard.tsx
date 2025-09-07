import { useEffect, useState } from "react";
import { DashboardWidgetModel } from "../../../models/dashboard-widget.model";
import { useSettingsContext } from "../../../context/settings-context";
import {
  DashboardWidgetLayout,
  DashboardWidgetsSettingsModel,
} from "../../../models/dashboard-widgets-settings.model";
import { Button } from "../../../components/ui/button";
import { GripVertical, Minus, Plus, X } from "lucide-react";

interface DashboardPageProps {
  widgets?: DashboardWidgetModel[];
}

export function DashboardPage({ widgets = [] }: DashboardPageProps) {
  const { getSetting, updateSetting } = useSettingsContext();
  const [layout, setLayout] = useState<DashboardWidgetLayout[]>([]);
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
        setLayout(stored.value.widgets);
      } else {
        setLayout(
          widgets.map((w) => ({ key: w.key, width: w.defaultWidth ?? 1 }))
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
      { key, width: widget?.defaultWidth ?? 1 },
    ]);
  };

  const handleWidthChange = (key: string, width: number) => {
    setLayout(layout.map((l) => (l.key === key ? { ...l, width } : l)));
  };

  const handleSave = async () => {
    await updateSetting("dashboard", "dashboard:widgets", {
      widgets: layout,
    });
    setEditing(false);
  };

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
        <Button onClick={() => setEditing((v) => !v)}>
          {editing ? "Chiudi" : "Personalizza"}
        </Button>
      </div>

      {displayed.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayed.map((layoutItem, index) => {
            const widget = widgetMap.get(layoutItem.key)!;
            const isDragOver = dragOverIndex === index;
            return (
              <div
                key={layoutItem.key}
                  className={`relative lg:col-span-${layoutItem.width} ${
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
                    <div className="absolute top-2 left-2 text-muted-foreground cursor-move">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleWidthChange(
                            layoutItem.key,
                            Math.max(1, layoutItem.width - 1)
                          )
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleWidthChange(
                            layoutItem.key,
                            Math.min(3, layoutItem.width + 1)
                          )
                        }
                      >
                        <Plus className="h-4 w-4" />
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
                {widget.component}
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <>
          {available.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-2">Widget disponibili</h2>
              <div className="flex flex-wrap gap-4">
                {available.map((w) => (
                  <Button
                    key={w.key}
                    variant="secondary"
                    onClick={() => handleAdd(w.key)}
                  >
                    {w.key}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <div className="mt-8 flex justify-end gap-4">
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Annulla
            </Button>
            <Button onClick={handleSave}>Salva</Button>
          </div>
        </>
      )}
    </div>
  );
}
