import { Separator } from "../../../components/ui/separator";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { TagsInput } from "../../../components/tag-input";
import { Button } from "../../../components/ui/button";
import { FileJson } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../components/ui/select";
import { useTranslation } from "react-i18next";
import { useApi } from "../../../hooks/use-api";
import { CategoryResponseDetailsModel } from "@kitejs-cms/core/index";
import { useEffect, useState } from "react";
import { MultiSelect } from "../../../components/multi-select";

interface SettingsSectionProps {
  status: string;
  publishAt: string;
  expireAt: string;
  tags: string[];
  categories?: string[];
  createdBy: string;
  updatedBy: string;
  type: "Post" | "Page";
  onChange: (
    field: "status" | "publishAt" | "expireAt" | "tags" | "categories",
    value: string | string[]
  ) => void;
  onViewJson: () => void;
}

export function SettingsSection({
  status = "draft",
  publishAt,
  expireAt,
  tags,
  categories = [],
  createdBy,
  updatedBy,
  type,
  onChange,
  onViewJson,
}: SettingsSectionProps) {
  const { t, i18n } = useTranslation("pages");
  const [categoryOptions, setCategoryOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const { data, fetchData } = useApi<CategoryResponseDetailsModel[]>();

  const toInputDate = (iso: string) =>
    iso ? new Date(iso).toISOString().slice(0, 16) : "";

  useEffect(() => {
    if (type === "Post") {
      fetchData("categories?page=1&itemsPerPage=100");
    }
  }, [fetchData, type]);

  useEffect(() => {
    if (data) {
      const local = i18n.language.split("-")[0];
      setCategoryOptions(
        data.map((category) => ({
          value: category.id,
          label: category.translations[local]?.title || category.id,
        }))
      );
    }
  }, [data, i18n.language]);

  const handleCategoriesChange = (selectedCategories: string[]) => {
    onChange("categories", selectedCategories);
  };

  return (
    <Card className="w-full shadow-neutral-50 gap-0 py-0">
      <CardHeader className="bg-secondary text-primary py-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <CardTitle>{t("sections.settings")}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewJson}
            className="flex items-center"
            aria-label={t("buttons.viewJson")}
          >
            <FileJson className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="p-4 md:p-6 space-y-4">
        {/* Status */}
        <div>
          <Label className="mb-2 block">{t("fields.status")}</Label>
          <Select
            value={status}
            onValueChange={(val) => onChange("status", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("fields.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Draft">{t("status.draft")}</SelectItem>
              <SelectItem value="Published">{t("status.published")}</SelectItem>
              <SelectItem value="Archived">{t("status.archived")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Publish At */}
        <div>
          <Label className="mb-2 block">{t("fields.publishAt")}</Label>
          <Input
            type="datetime-local"
            value={toInputDate(publishAt)}
            onChange={(e) => onChange("publishAt", e.target.value)}
            className="w-full"
          />
        </div>

        {/* Expire At */}
        <div>
          <Label className="mb-2 block">{t("fields.expireAt")}</Label>
          <Input
            type="datetime-local"
            value={toInputDate(expireAt)}
            onChange={(e) => onChange("expireAt", e.target.value)}
            className="w-full"
          />
        </div>

        {/* Categories - Mostrato solo per Post e se ci sono opzioni */}
        {type === "Post" && categoryOptions.length > 0 && (
          <div>
            <Label className="mb-2 block">{t("fields.categories")}</Label>
            <MultiSelect
              options={categoryOptions}
              initialTags={categories}
              onChange={handleCategoriesChange}
            />
          </div>
        )}

        {/* Tags */}
        <div>
          <Label className="mb-2 block">{t("fields.tags")}</Label>
          <TagsInput
            initialTags={tags}
            onChange={(newTags) => onChange("tags", newTags)}
          />
        </div>

        {/* Created By */}
        <div>
          <Label className="mb-2 block">{t("fields.createdBy")}</Label>
          <Input
            value={createdBy}
            disabled
            className="w-full cursor-not-allowed"
          />
        </div>

        {/* Modified By */}
        <div>
          <Label className="mb-2 block">{t("fields.updatedBy")}</Label>
          <Input
            value={updatedBy}
            disabled
            className="w-full cursor-not-allowed"
          />
        </div>
      </CardContent>
    </Card>
  );
}
