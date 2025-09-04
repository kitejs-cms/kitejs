import {
  Separator,
  Input,
  Label,
  TagsInput,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@kitejs-cms/dashboard-core";
import { FileJson } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

interface SettingsSectionProps {
  status?: string;
  publishAt?: string;
  expireAt?: string;
  tags?: string[];
  createdBy?: string;
  updatedBy?: string;
  title?: string;
  children?: ReactNode;
  onChange?: (
    field: "status" | "publishAt" | "expireAt" | "tags",
    value: string | string[]
  ) => void;
  onViewJson?: () => void;
}

export function SettingsSection({
  status = "draft",
  publishAt = "",
  expireAt = "",
  tags = [],
  createdBy = "",
  updatedBy = "",
  title,
  children,
  onChange,
  onViewJson,
}: SettingsSectionProps) {
  const { t } = useTranslation("gallery");

  const toInputDate = (iso: string) =>
    iso ? new Date(iso).toISOString().slice(0, 16) : "";

  return (
    <Card className="w-full shadow-neutral-50 gap-0 py-0">
      <CardHeader className="bg-secondary text-primary py-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <CardTitle>{title ?? t("sections.settings")}</CardTitle>
          {onViewJson && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewJson}
              className="flex items-center"
              aria-label={t("buttons.viewJson")}
            >
              <FileJson className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="p-4 md:p-6 space-y-4">
        {children ?? (
          <>
            <div>
              <Label className="mb-2 block">{t("fields.status")}</Label>
              <Select
                value={status}
                onValueChange={(val) => onChange?.("status", val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("fields.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">{t("status.draft")}</SelectItem>
                  <SelectItem value="Published">
                    {t("status.published")}
                  </SelectItem>
                  <SelectItem value="Archived">{t("status.archived")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">{t("fields.publishAt")}</Label>
              <Input
                type="datetime-local"
                value={toInputDate(publishAt)}
                onChange={(e) => onChange?.("publishAt", e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <Label className="mb-2 block">{t("fields.expireAt")}</Label>
              <Input
                type="datetime-local"
                value={toInputDate(expireAt)}
                onChange={(e) => onChange?.("expireAt", e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <Label className="mb-2 block">{t("fields.tags")}</Label>
              <TagsInput
                initialTags={tags}
                onChange={(newTags) => onChange?.("tags", newTags)}
              />
            </div>

            <div>
              <Label className="mb-2 block">{t("fields.createdBy")}</Label>
              <Input
                value={createdBy}
                disabled
                className="w-full cursor-not-allowed"
              />
            </div>

            <div>
              <Label className="mb-2 block">{t("fields.updatedBy")}</Label>
              <Input
                value={updatedBy}
                disabled
                className="w-full cursor-not-allowed"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

