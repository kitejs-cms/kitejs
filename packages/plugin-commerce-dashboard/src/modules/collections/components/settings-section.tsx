import { CollectionResponseDetailslModel } from "@kitejs-cms/plugin-commerce-api";
import { FileJson } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  TagsInput,
  useApi,
} from "@kitejs-cms/dashboard-core";

interface SettingsSectionProps {
  status: string;
  publishAt?: string;
  expireAt?: string;
  tags: string[];
  parent?: string;
  createdBy: string;
  updatedBy: string;
  onChange: (
    field: "status" | "publishAt" | "expireAt" | "tags" | "parent",
    value: string | string[] | undefined
  ) => void;
  onViewJson: () => void;
}

export function SettingsSection(props: SettingsSectionProps) {
  const {
    status = "draft",
    publishAt,
    expireAt,
    tags,
    parent,
    createdBy,
    updatedBy,
    onChange,
    onViewJson,
  } = props;

  const { t, i18n } = useTranslation("pages");

  const [collectionOptions, setCollectionOptions] = useState<
    { value: string; label: string }[]
  >([]);

  const { data, fetchData } = useApi<CollectionResponseDetailslModel[]>();

  const toInputDate = (iso?: string) =>
    iso ? new Date(iso).toISOString().slice(0, 16) : "";

  useEffect(() => {
    fetchData("commerce/collections?page[number]=1&page[size]=100");
  }, [fetchData]);

  useEffect(() => {
    if (data) {
      const local = i18n.language.split("-")[0];
      setCollectionOptions(
        data.map((collection) => ({
          value: collection.id,
          label: collection.translations?.[local]?.title || collection.id,
        }))
      );
    }
  }, [data, i18n.language]);

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
            value={toInputDate(publishAt)} // sempre stringa
            onChange={(e) => onChange("publishAt", e.target.value || undefined)}
            className="w-full"
          />
        </div>

        {/* Expire At */}
        <div>
          <Label className="mb-2 block">{t("fields.expireAt")}</Label>
          <Input
            type="datetime-local"
            value={toInputDate(expireAt)} // sempre stringa
            onChange={(e) => onChange("expireAt", e.target.value || undefined)}
            className="w-full"
          />
        </div>

        {/* Collection padre (sotto-collection) — opzionale */}
        {collectionOptions.length > 0 && (
          <div>
            <Label className="mb-2 block">
              {t("fields.parentCollection", {
                defaultValue: "Collection principale",
              })}
            </Label>

            <Select
              value={parent ?? "__none__"}
              onValueChange={(val) =>
                onChange("parent", val === "__none__" ? undefined : val)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={t("placeholders.selectParentCollection", {
                    defaultValue: "Seleziona la collection padre (opzionale)",
                  })}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  {t("common.none", { defaultValue: "Nessuna" })}
                </SelectItem>
                {collectionOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Tags */}
        <div>
          <Label className="mb-2 block">{t("fields.tags")}</Label>
          <TagsInput
            initialTags={tags ?? []}
            onChange={(newTags) => onChange("tags", newTags)}
          />
        </div>

        {/* Created By */}
        <div>
          <Label className="mb-2 block">{t("fields.createdBy")}</Label>
          <Input
            value={createdBy ?? ""}
            disabled
            className="w-full cursor-not-allowed"
          />
        </div>

        {/* Modified By */}
        <div>
          <Label className="mb-2 block">{t("fields.updatedBy")}</Label>
          <Input
            value={updatedBy ?? ""}
            disabled
            className="w-full cursor-not-allowed"
          />
        </div>
      </CardContent>
    </Card>
  );
}
