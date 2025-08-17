import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useApi,
} from "@kitejs-cms/dashboard-core";

interface Gallery {
  id: string;
  translations?: Record<string, { title?: string }>;
}

export function GalleriesManagePage() {
  const { t, i18n } = useTranslation("gallery");
  const { data, fetchData, loading } = useApi<Gallery[]>();

  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    fetchData("galleries");
  }, [fetchData]);

  const handleCreate = async () => {
    if (!slug || !title) return;

    const { error } = await fetchData(
      "galleries",
      "POST",
      {
        slug,
        title,
        language: i18n.language || "en",
        status: "Draft",
      }
    );

    if (!error) {
      setSlug("");
      setTitle("");
      fetchData("galleries");
    }
  };

  const galleries = data ?? [];

  return (
    <div className="p-4 flex justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>{t("title.manageGalleries")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder={t("fields.slug")}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            <Input
              placeholder={t("fields.title")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Button onClick={handleCreate}>{t("buttons.create")}</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>{t("fields.title")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {galleries.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>{g.id}</TableCell>
                  <TableCell>
                    {g.translations?.[i18n.language]?.title ?? ""}
                  </TableCell>
                </TableRow>
              ))}
              {galleries.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">
                    {t("title.noGalleries")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
