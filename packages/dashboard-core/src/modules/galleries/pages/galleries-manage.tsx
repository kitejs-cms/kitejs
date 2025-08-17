import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBreadcrumb } from "../../../context/breadcrumb-context";
import { useApi } from "../../../hooks/use-api";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { toast } from "sonner";

interface GalleryItem {
  id: string;
  title: string;
}

export function GalleriesManagePage() {
  const { t } = useTranslation("galleries");
  const { setBreadcrumb } = useBreadcrumb();
  const { data, fetchData, loading } = useApi<GalleryItem[]>();
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    setBreadcrumb([
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.galleries"), path: "/galleries" },
    ]);
    fetchData("galleries");
  }, [fetchData, setBreadcrumb, t]);

  const handleCreate = async () => {
    const { error } = await fetchData("galleries", "POST", {
      title: newTitle,
      images: [],
    });
    if (!error) {
      toast.success(t("messages.created"));
      setNewTitle("");
      fetchData("galleries");
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await fetchData(`galleries/${id}`, "DELETE");
    if (!error) {
      toast.success(t("messages.deleted"));
      fetchData("galleries");
    }
  };

  const handleSort = async () => {
    if (!data) return;
    const order = [...data]
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((g) => g.id);
    await fetchData("galleries/order", "PATCH", { order });
    fetchData("galleries");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("menu.galleries")}</CardTitle>
        <Button variant="outline" onClick={handleSort} disabled={loading}>
          {t("actions.sort")}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={t("fields.title") as string}
          />
          <Button onClick={handleCreate} disabled={!newTitle}>
            {t("actions.create")}
          </Button>
        </div>
        <ul className="space-y-2">
          {data?.map((gallery) => (
            <li key={gallery.id} className="flex justify-between">
              <span>{gallery.title}</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(gallery.id)}
              >
                {t("actions.delete")}
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
