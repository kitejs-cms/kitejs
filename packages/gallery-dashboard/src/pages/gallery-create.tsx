import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  useApi,
} from "@kitejs-cms/dashboard-core";

export function GalleryCreatePage() {
  const { t, i18n } = useTranslation("gallery");
  const navigate = useNavigate();
  const { fetchData } = useApi<{ id: string }>();

  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");

  const handleSubmit = async () => {
    const { data } = await fetchData("galleries", "POST", {
      slug,
      translations: {
        [i18n.language]: { title },
      },
    });
    if (data?.id) {
      navigate(`/galleries/${data.id}`);
    }
  };

  return (
    <div className="p-4 flex justify-center">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>{t("title.createGallery")}</CardTitle>
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
          <Button onClick={handleSubmit}>{t("buttons.save")}</Button>
        </CardContent>
      </Card>
    </div>
  );
}

