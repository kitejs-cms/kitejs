import { useState, type DragEvent as ReactDragEvent } from "react";
import { Button } from "@kitejs-cms/dashboard-core";
import { GripVertical, XIcon } from "lucide-react";
import type { GalleryItemModel } from "../../../../plugin-gallery-api/dist";
import { useTranslation } from "react-i18next";

type GridPreviewProps = {
  items: GalleryItemModel[];
  columns: number;
  gap: number;
  disableItemDrag?: boolean;
  onReorder: (nextItems: GalleryItemModel[]) => void;
  onDelete?: (id: string) => void;
};

export function GridPreview({
  items,
  columns,
  gap,
  disableItemDrag,
  onReorder,
  onDelete,
}: GridPreviewProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const { t } = useTranslation("gallery");

  const handleDragStart = (idx: number, e?: ReactDragEvent<HTMLDivElement>) => {
    setDragIndex(idx);
    setHoverIndex(idx);
    if (e?.dataTransfer) {
      try {
        e.dataTransfer.setData("text/plain", String(idx));
      } catch {
        /* noop */
      }
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const handleDropReorder = (
    e: ReactDragEvent<HTMLDivElement>,
    idx: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragIndex === null || dragIndex === idx) {
      setHoverIndex(null);
      setDragIndex(null);
      return;
    }
    const reordered = [...items];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(idx, 0, moved);
    setDragIndex(null);
    setHoverIndex(null);
    onReorder(reordered);
  };

  return (
    <div
      className="[&>*]:mb-4"
      style={{
        columnCount: Math.max(1, columns),
        columnGap: `${Math.max(0, gap)}px`,
      }}
    >
      {items.map((item, index) => (
        <div key={item.id} className="break-inside-avoid">
          {/* Placeholder visivo prima dell'elemento durante il drag */}
          {dragIndex !== null && hoverIndex === index && (
            <div
              className="mb-4 h-8 rounded-md border-2 border-dashed"
              aria-hidden
            />
          )}

          <div
            draggable={!disableItemDrag}
            onDragStart={(e) => handleDragStart(index, e)}
            onDragOver={(e: ReactDragEvent<HTMLDivElement>) => {
              e.preventDefault();
              // se si sta trascinando un file, evita di impostare hover su item
              if (e.dataTransfer?.types?.includes?.("Files")) {
                e.dataTransfer.dropEffect = "copy";
              } else {
                e.dataTransfer.dropEffect = "move";
                setHoverIndex(index);
              }
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              if (!e.dataTransfer?.types?.includes?.("Files")) {
                setHoverIndex(index);
              }
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setHoverIndex(null);
            }}
            onDrop={(e: ReactDragEvent<HTMLDivElement>) => {
              // se è un drop di file, NON gestiamo qui (lascia bubbling al container esterno)
              if (e.dataTransfer?.files?.length) return;
              handleDropReorder(e, index);
            }}
            className={`relative group overflow-hidden mb-4 transition-shadow ${
              dragIndex === index ? "cursor-grabbing" : "cursor-grab"
            } shadow-sm hover:shadow-lg ${
              hoverIndex === index && dragIndex !== null
                ? "ring-2 ring-offset-2"
                : ""
            }`}
            aria-label={t("editor.grid.itemAria")}
            title={t("editor.grid.itemTitle")}
          >
            <div className="pointer-events-none absolute top-2 left-2 z-10 rounded-md bg-black/50 p-1 text-white">
              <GripVertical className="w-3 h-3" />
            </div>

            <img
              src={item.linkUrl}
              alt={item.altOverride ?? ""}
              className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.02]"
              draggable={false}
            />

            {onDelete && (
              <Button
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                onClick={() => onDelete(item.id)}
                aria-label={t("editor.grid.deleteAria")}
                title={t("buttons.delete")}
              >
                <XIcon className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      ))}

      {/* Placeholder alla fine della lista quando trascini oltre l'ultimo */}
      {dragIndex !== null && hoverIndex === items.length && (
        <div
          className="mb-4 h-8 rounded-md border-2 border-dashed"
          aria-hidden
        />
      )}
    </div>
  );
}
