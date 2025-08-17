import { ChangeEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  useApi,
} from "@kitejs-cms/dashboard-core";

interface GalleryItem {
  id: string;
  assetId: string;
}

interface Gallery {
  id: string;
  slug?: string;
  translations: Record<string, { title?: string }>;
  items: GalleryItem[];
}

export function GalleryEditPage() {
  const { t, i18n } = useTranslation("gallery");
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, fetchData } = useApi<Gallery>();

  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchData(`galleries/${id}`);
  }, [id, fetchData]);

  useEffect(() => {
    if (data) {
      setSlug(data.slug || "");
      setTitle(data.translations?.[i18n.language]?.title || "");
      setItems(data.items || []);
    }
  }, [data, i18n.language]);

  const handleSave = async () => {
    await fetchData("galleries", "POST", {
      id,
      slug,
      translations: {
        [i18n.language]: { title },
      },
    });
  };

  const handleDelete = async () => {
    const res = await fetchData(`galleries/${id}`, "DELETE");
    if (res) {
      navigate("/galleries");
    }
  };

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const { data: asset } = await fetchData("assets", "POST", form);
    if (asset?.id) {
      const { data: updated } = await fetchData(`galleries/${id}/items`, "POST", {
        assetId: asset.id,
      });
      if (updated) {
        setItems(updated.items);
      }
    }
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDrop = async (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    const reordered = [...items];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    setItems(reordered);
    setDragIndex(null);
    await fetchData(`galleries/${id}/items/sort`, "POST", {
      itemIds: reordered.map((i) => i.id),
    });
  };

  return (
    <div className="p-4 flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{t("title.editGallery")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input
            placeholder={t("fields.slug") as string}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <Input
            placeholder={t("fields.title") as string}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex flex-col gap-2">
            <label className="font-medium">{t("buttons.uploadImage")}</label>
            <Input type="file" onChange={handleUpload} />
            <ul className="flex flex-col gap-2 mt-2">
              {items.map((item, index) => (
                <li
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(index)}
                  className="border rounded p-2 cursor-move bg-white"
                >
                  {item.assetId}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>{t("buttons.save")}</Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t("buttons.deleteGallery")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

