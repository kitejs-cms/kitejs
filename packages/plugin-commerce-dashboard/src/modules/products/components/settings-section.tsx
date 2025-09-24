import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FileJson } from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  Separator,
  CardContent,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Input,
  TagsInput,
} from "@kitejs-cms/dashboard-core";
import { ProductStatus } from "@kitejs-cms/plugin-commerce-api";

interface ProductSettingsSectionProps {
  status?: string;
  publishAt?: string | null;
  expireAt?: string | null;
  tags?: string[];
  defaultCurrency?: string;
  thumbnail?: string | null;
  gallery?: string[];
  createdBy?: string;
  updatedBy?: string;
  onChange: (
    field:
      | "status"
      | "publishAt"
      | "expireAt"
      | "tags"
      | "defaultCurrency"
      | "thumbnail"
      | "gallery",
    value: string | string[] | null
  ) => void;
  onViewJson: () => void;
}

export function ProductSettingsSection({
  status,
  publishAt,
  expireAt,
  tags,
  defaultCurrency,
  thumbnail,
  gallery,
  createdBy,
  updatedBy,
  onChange,
  onViewJson,
}: ProductSettingsSectionProps) {
  const { t } = useTranslation("commerce");

  const statusOptions = useMemo(
    () => [
      { value: ProductStatus.Draft, label: t("products.status.draft") },
      { value: ProductStatus.Active, label: t("products.status.active") },
      { value: ProductStatus.Archived, label: t("products.status.archived") },
    ],
    [t]
  );

  const toInputDate = (value?: string | null) =>
    value ? new Date(value).toISOString().slice(0, 16) : "";

  return (
    <Card className="w-full gap-0 py-0 shadow-neutral-50">
      <CardHeader className="rounded-t-xl bg-secondary py-4 text-primary">
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
      <CardContent className="space-y-4 p-4 md:p-6">
        <div>
          <Label className="mb-2 block" htmlFor="product-status">
            {t("products.fields.status")}
          </Label>
          <Select
            value={status ?? ProductStatus.Draft}
            onValueChange={(value) => onChange("status", value)}
          >
            <SelectTrigger id="product-status">
              <SelectValue placeholder={t("products.fields.status")} />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block" htmlFor="product-publish-at">
            {t("products.fields.publishAt")}
          </Label>
          <Input
            id="product-publish-at"
            type="datetime-local"
            value={toInputDate(publishAt)}
            onChange={(event) =>
              onChange("publishAt", event.target.value || null)
            }
          />
        </div>

        <div>
          <Label className="mb-2 block" htmlFor="product-expire-at">
            {t("products.fields.expireAt")}
          </Label>
          <Input
            id="product-expire-at"
            type="datetime-local"
            value={toInputDate(expireAt)}
            onChange={(event) =>
              onChange("expireAt", event.target.value || null)
            }
          />
        </div>

        <div>
          <Label className="mb-2 block" htmlFor="product-default-currency">
            {t("products.fields.defaultCurrency")}
          </Label>
          <Input
            id="product-default-currency"
            value={defaultCurrency ?? ""}
            onChange={(event) => onChange("defaultCurrency", event.target.value)}
          />
        </div>

        <div>
          <Label className="mb-2 block" htmlFor="product-tags">
            {t("products.fields.tags")}
          </Label>
          <TagsInput
            id="product-tags"
            initialTags={tags ?? []}
            onChange={(value) => onChange("tags", value)}
          />
        </div>

        <div>
          <Label className="mb-2 block" htmlFor="product-thumbnail">
            {t("products.fields.thumbnail")}
          </Label>
          <Input
            id="product-thumbnail"
            value={thumbnail ?? ""}
            onChange={(event) => onChange("thumbnail", event.target.value)}
          />
        </div>

        <div>
          <Label className="mb-2 block" htmlFor="product-gallery">
            {t("products.fields.gallery")}
          </Label>
          <TagsInput
            id="product-gallery"
            initialTags={gallery ?? []}
            onChange={(value) => onChange("gallery", value)}
          />
        </div>

        <div>
          <Label className="mb-2 block" htmlFor="product-created-by">
            {t("products.fields.createdBy")}
          </Label>
          <Input
            id="product-created-by"
            value={createdBy ?? ""}
            readOnly
            className="cursor-not-allowed opacity-80"
          />
        </div>

        <div>
          <Label className="mb-2 block" htmlFor="product-updated-by">
            {t("products.fields.updatedBy")}
          </Label>
          <Input
            id="product-updated-by"
            value={updatedBy ?? ""}
            readOnly
            className="cursor-not-allowed opacity-80"
          />
        </div>
      </CardContent>
    </Card>
  );
}
