import { FileJson } from "lucide-react";
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
} from "@kitejs-cms/dashboard-core";

interface SettingsSectionProps {
  status: string;
  publishAt?: string;
  expireAt?: string;
  tags: string[];
  createdBy: string;
  updatedBy: string;
  onChange: (
    field: "status" | "publishAt" | "expireAt" | "tags",
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
    createdBy,
    updatedBy,
    onChange,
    onViewJson,
  } = props;

  const { t } = useTranslation("commerce");

  const toInputDate = (iso?: string) =>
    iso ? new Date(iso).toISOString().slice(0, 16) : "";

  return (
    <Card className="w-full shadow-neutral-50 gap-0 py-0">
      <CardHeader className="bg-secondary text-primary py-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <CardTitle>{t("products.sections.settings")}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewJson}
            className="flex items-center"
            aria-label={t("products.buttons.viewJson")}
          >
            <FileJson className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="p-4 md:p-6 space-y-4">
        {/* Status */}
        <div>
          <Label className="mb-2 block">{t("products.fields.status")}</Label>
          <Select
            value={status}
            onValueChange={(val) => onChange("status", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("products.fields.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">
                {t("products.status.draft")}
              </SelectItem>
              <SelectItem value="published">
                {t("products.status.published")}
              </SelectItem>
              <SelectItem value="archived">
                {t("products.status.archived")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Publish At */}
        <div>
          <Label className="mb-2 block">{t("products.fields.publishAt")}</Label>
          <Input
            type="datetime-local"
            value={toInputDate(publishAt)}
            onChange={(e) => onChange("publishAt", e.target.value || undefined)}
            className="w-full"
          />
        </div>

        {/* Expire At */}
        <div>
          <Label className="mb-2 block">{t("products.fields.expireAt")}</Label>
          <Input
            type="datetime-local"
            value={toInputDate(expireAt)}
            onChange={(e) => onChange("expireAt", e.target.value || undefined)}
            className="w-full"
          />
        </div>

        {/* Tags */}
        <div>
          <Label className="mb-2 block">{t("products.fields.tags")}</Label>
          <TagsInput
            initialTags={tags ?? []}
            onChange={(newTags) => onChange("tags", newTags)}
          />
        </div>

        {/* Created By */}
        <div>
          <Label className="mb-2 block">{t("products.fields.createdBy")}</Label>
          <Input
            value={createdBy ?? ""}
            disabled
            className="w-full cursor-not-allowed"
          />
        </div>

        {/* Modified By */}
        <div>
          <Label className="mb-2 block">{t("products.fields.updatedBy")}</Label>
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
