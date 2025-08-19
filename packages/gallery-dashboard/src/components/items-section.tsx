import { ChangeEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Separator,
  Input,
} from "@kitejs-cms/dashboard-core";
import type { GalleryItemModel } from "@kitejs-cms/gallery-plugin";

interface Item extends GalleryItemModel {
  id: string;
}

interface Props {
  items: Item[];
  onUpload: (file: File) => void;
  onSort: (ids: string[]) => void;
}

export function GalleryItemsSection({ items, onUpload, onSort }: Props) {
  const { t } = useTranslation("gallery");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    const reordered = [...items];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    onSort(reordered.map((i) => i.id));
    setDragIndex(null);
  };

  return (
    <Card className="w-full shadow-neutral-50 gap-0 py-0">
      <CardHeader className="bg-secondary text-primary py-6 rounded-t-xl">
        <CardTitle>{t("sections.items")}</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="p-4 md:p-6 space-y-4">
        <Input type="file" onChange={handleUpload} />
        <ul className="flex flex-col gap-2">
          {items.map((item, index) => (
            <li
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(index)}
              className="border rounded p-2 bg-white cursor-move text-sm flex items-center gap-2"
            >
              <img
                src={item.linkUrl}
                alt=""
                className="w-16 h-16 object-cover rounded"
              />
              <span className="truncate">{item.assetId}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
