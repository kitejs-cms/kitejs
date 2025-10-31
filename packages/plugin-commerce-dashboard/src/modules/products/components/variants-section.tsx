import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Switch,
} from "@kitejs-cms/dashboard-core";
import type {
  ProductPriceModel,
  ProductVariantModel,
} from "@kitejs-cms/plugin-commerce-api";

export type VariantState = (ProductVariantModel & {
  id?: string;
  allowBackorder?: boolean;
  prices?: ProductPriceModel[];
}) & Record<string, unknown>;

interface VariantsSectionProps {
  variants: VariantState[];
  defaultCurrency: string;
  onAddVariant: () => void;
  onRemoveVariant: (index: number) => void;
  onVariantChange: (
    index: number,
    field:
      | "title"
      | "sku"
      | "barcode"
      | "inventoryQuantity"
      | "allowBackorder",
    value: string | number | boolean | undefined
  ) => void;
  onVariantPriceChange: (
    index: number,
    field: keyof ProductPriceModel,
    value: string
  ) => void;
}

const getPrimaryPrice = (
  variant: VariantState,
  fallbackCurrency: string
): ProductPriceModel => {
  const primary = variant.prices?.[0];

  if (!primary) {
    return {
      currencyCode: fallbackCurrency,
      amount: 0,
      compareAtAmount: undefined,
    };
  }

  return {
    currencyCode: primary.currencyCode ?? fallbackCurrency,
    amount: typeof primary.amount === "number" ? primary.amount : 0,
    compareAtAmount: primary.compareAtAmount,
  };
};

export function VariantsSection({
  variants,
  defaultCurrency,
  onAddVariant,
  onRemoveVariant,
  onVariantChange,
  onVariantPriceChange,
}: VariantsSectionProps) {
  const { t } = useTranslation("commerce");

  const emptyState = (
    <div className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
      {t("products.details.variants.empty")}
    </div>
  );

  return (
    <Card className="w-full gap-0 py-0 shadow-neutral-50">
      <CardHeader className="rounded-t-xl bg-secondary py-6 text-primary">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t("products.details.variants.title")}</CardTitle>
            <p className="text-sm text-primary/70">
              {t("products.details.variants.description")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={onAddVariant}
          >
            <Plus className="h-4 w-4" />
            {t("products.details.variants.add")}
          </Button>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-4 p-4 md:p-6">
        {variants.length === 0 && emptyState}
        {variants.length > 0 && (
          <div className="space-y-4">
            {variants.map((variant, index) => {
              const price = getPrimaryPrice(variant, defaultCurrency);

              return (
                <div
                  key={variant.id ?? `${index}`}
                  className="space-y-4 rounded-xl border border-border bg-background p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">
                      {t("products.details.variants.itemTitle", { index: index + 1 })}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onRemoveVariant(index)}
                      aria-label={t("products.details.variants.remove")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`variant-title-${index}`}>
                        {t("products.details.variants.fields.name")}
                      </Label>
                      <Input
                        id={`variant-title-${index}`}
                        value={(variant.title as string) ?? ""}
                        onChange={(event) =>
                          onVariantChange(index, "title", event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`variant-sku-${index}`}>
                        {t("products.details.variants.fields.sku")}
                      </Label>
                      <Input
                        id={`variant-sku-${index}`}
                        value={(variant.sku as string) ?? ""}
                        onChange={(event) =>
                          onVariantChange(index, "sku", event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`variant-barcode-${index}`}>
                        {t("products.details.variants.fields.barcode")}
                      </Label>
                      <Input
                        id={`variant-barcode-${index}`}
                        value={(variant.barcode as string) ?? ""}
                        onChange={(event) =>
                          onVariantChange(index, "barcode", event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`variant-inventory-${index}`}>
                        {t("products.details.variants.fields.inventory")}
                      </Label>
                      <Input
                        id={`variant-inventory-${index}`}
                        type="number"
                        min={0}
                        value={
                          typeof variant.inventoryQuantity === "number"
                            ? variant.inventoryQuantity
                            : ""
                        }
                        onChange={(event) =>
                          onVariantChange(
                            index,
                            "inventoryQuantity",
                            event.target.value === ""
                              ? undefined
                              : Number(event.target.value)
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor={`variant-price-${index}`}>
                        {t("products.details.variants.fields.price")}
                      </Label>
                      <Input
                        id={`variant-price-${index}`}
                        type="number"
                        min={0}
                        step="0.01"
                        value={
                          typeof price.amount === "number" ? price.amount : ""
                        }
                        onChange={(event) =>
                          onVariantPriceChange(
                            index,
                            "amount",
                            event.target.value
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`variant-compare-${index}`}>
                        {t("products.details.variants.fields.compareAt")}
                      </Label>
                      <Input
                        id={`variant-compare-${index}`}
                        type="number"
                        min={0}
                        step="0.01"
                        value={
                          typeof price.compareAtAmount === "number"
                            ? price.compareAtAmount
                            : ""
                        }
                        onChange={(event) =>
                          onVariantPriceChange(
                            index,
                            "compareAtAmount",
                            event.target.value
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`variant-currency-${index}`}>
                        {t("products.details.variants.fields.currency")}
                      </Label>
                      <Input
                        id={`variant-currency-${index}`}
                        value={price.currencyCode ?? defaultCurrency}
                        maxLength={3}
                        onChange={(event) =>
                          onVariantPriceChange(
                            index,
                            "currencyCode",
                            event.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <div className="pr-4">
                        <p className="text-sm font-medium">
                          {t("products.details.variants.fields.backorder")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t(
                            "products.details.variants.fields.backorderDescription"
                          )}
                        </p>
                      </div>
                      <Switch
                        id={`variant-backorder-${index}`}
                        checked={Boolean(variant.allowBackorder)}
                        onCheckedChange={(checked) =>
                          onVariantChange(index, "allowBackorder", checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
