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
  ProductVariantFormModel,
  ProductVariantPriceFormModel,
} from "../hooks/use-product-details";

interface ProductVariantsSectionProps {
  variants: ProductVariantFormModel[];
  defaultCurrency?: string;
  error?: string;
  onAddVariant: () => void;
  onRemoveVariant: (variantKey: string) => void;
  onVariantChange: (
    variantKey: string,
    field: keyof Omit<ProductVariantFormModel, "_tempId" | "prices">,
    value: string | number | boolean | undefined
  ) => void;
  onAddPrice: (variantKey: string) => void;
  onRemovePrice: (variantKey: string, priceKey: string) => void;
  onPriceChange: (
    variantKey: string,
    priceKey: string,
    field: keyof ProductVariantPriceFormModel,
    value: string | number | undefined
  ) => void;
}

export function ProductVariantsSection({
  variants,
  defaultCurrency,
  error,
  onAddVariant,
  onRemoveVariant,
  onVariantChange,
  onAddPrice,
  onRemovePrice,
  onPriceChange,
}: ProductVariantsSectionProps) {
  const { t } = useTranslation("commerce");

  const renderPriceRow = (
    variantKey: string,
    price: ProductVariantPriceFormModel
  ) => {
    const priceKey = price._tempId;
    const amountValue =
      typeof price.amount === "number" && !Number.isNaN(price.amount)
        ? price.amount
        : "";
    const compareAtValue =
      typeof price.compareAtAmount === "number" &&
      !Number.isNaN(price.compareAtAmount)
        ? price.compareAtAmount
        : "";

    return (
      <div
        key={priceKey}
        className="flex flex-col gap-3 rounded-md border border-border p-3 md:flex-row md:items-end"
      >
        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <Label
              htmlFor={`variant-${variantKey}-price-${priceKey}-currency`}
            >
              {t("products.fields.priceCurrency")}
            </Label>
            <Input
              id={`variant-${variantKey}-price-${priceKey}-currency`}
              value={price.currencyCode ?? ""}
              maxLength={12}
              onChange={(event) =>
                onPriceChange(
                  variantKey,
                  priceKey,
                  "currencyCode",
                  event.target.value
                )
              }
              placeholder={defaultCurrency?.toUpperCase()}
            />
          </div>

          <div>
            <Label htmlFor={`variant-${variantKey}-price-${priceKey}-amount`}>
              {t("products.fields.priceAmount")}
            </Label>
            <Input
              id={`variant-${variantKey}-price-${priceKey}-amount`}
              type="number"
              inputMode="decimal"
              step="0.01"
              value={amountValue}
              onChange={(event) =>
                onPriceChange(
                  variantKey,
                  priceKey,
                  "amount",
                  event.target.value === ""
                    ? undefined
                    : Number(event.target.value)
                )
              }
            />
          </div>

          <div>
            <Label htmlFor={`variant-${variantKey}-price-${priceKey}-compare`}>
              {t("products.fields.priceCompareAt")}
            </Label>
            <Input
              id={`variant-${variantKey}-price-${priceKey}-compare`}
              type="number"
              inputMode="decimal"
              step="0.01"
              value={compareAtValue}
              onChange={(event) =>
                onPriceChange(
                  variantKey,
                  priceKey,
                  "compareAtAmount",
                  event.target.value === ""
                    ? undefined
                    : Number(event.target.value)
                )
              }
            />
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemovePrice(variantKey, priceKey)}
          aria-label={t("products.buttons.removePrice")}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const renderVariant = (variant: ProductVariantFormModel, index: number) => {
    const variantKey = variant.id ?? variant._tempId;
    const prices = variant.prices ?? [];
    const inventoryValue =
      typeof variant.inventoryQuantity === "number"
        ? variant.inventoryQuantity
        : "";

    return (
      <div key={variantKey} className="rounded-lg border border-border p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h4 className="text-base font-semibold">
              {variant.title?.trim()
                ? variant.title
                : t("products.variants.untitled", { index: index + 1 })}
            </h4>
            <p className="text-sm text-muted-foreground">
              {variant.sku?.trim()
                ? t("products.variants.sku", { sku: variant.sku })
                : t("products.variants.skuPlaceholder")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemoveVariant(variantKey)}
            aria-label={t("products.buttons.removeVariant")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor={`variant-${variantKey}-title`}>
              {t("products.fields.variantTitle")}
            </Label>
            <Input
              id={`variant-${variantKey}-title`}
              value={variant.title ?? ""}
              onChange={(event) =>
                onVariantChange(variantKey, "title", event.target.value)
              }
            />
          </div>

          <div>
            <Label htmlFor={`variant-${variantKey}-sku`}>
              {t("products.fields.variantSku")}
            </Label>
            <Input
              id={`variant-${variantKey}-sku`}
              value={variant.sku ?? ""}
              onChange={(event) =>
                onVariantChange(variantKey, "sku", event.target.value)
              }
            />
          </div>

          <div>
            <Label htmlFor={`variant-${variantKey}-barcode`}>
              {t("products.fields.variantBarcode")}
            </Label>
            <Input
              id={`variant-${variantKey}-barcode`}
              value={variant.barcode ?? ""}
              onChange={(event) =>
                onVariantChange(variantKey, "barcode", event.target.value)
              }
            />
          </div>

          <div>
            <Label htmlFor={`variant-${variantKey}-inventory`}>
              {t("products.fields.variantInventory")}
            </Label>
            <Input
              id={`variant-${variantKey}-inventory`}
              type="number"
              inputMode="numeric"
              min={0}
              value={inventoryValue}
              onChange={(event) =>
                onVariantChange(
                  variantKey,
                  "inventoryQuantity",
                  event.target.value === ""
                    ? undefined
                    : Number(event.target.value)
                )
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("products.variants.inventoryHint")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id={`variant-${variantKey}-backorder`}
              checked={Boolean(variant.allowBackorder)}
              onCheckedChange={(checked) =>
                onVariantChange(variantKey, "allowBackorder", checked)
              }
            />
            <Label htmlFor={`variant-${variantKey}-backorder`} className="cursor-pointer">
              {t("products.fields.variantAllowBackorder")}
            </Label>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                {t("products.variants.prices.title")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("products.variants.prices.description")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddPrice(variantKey)}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("products.buttons.addPrice")}
            </Button>
          </div>

          {prices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("products.variants.prices.empty")}
            </p>
          ) : (
            <div className="space-y-3">
              {prices.map((price) => renderPriceRow(variantKey, price))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full gap-0 py-0 shadow-neutral-50">
      <CardHeader className="rounded-t-xl bg-secondary py-4 md:py-6 text-primary">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{t("products.sections.variants")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("products.variants.description")}
            </p>
            {defaultCurrency ? (
              <p className="text-xs text-muted-foreground">
                {t("products.variants.defaultCurrency", {
                  currency: defaultCurrency.toUpperCase(),
                })}
              </p>
            ) : null}
          </div>
          <Button size="sm" onClick={onAddVariant}>
            <Plus className="mr-2 h-4 w-4" />
            {t("products.buttons.addVariant")}
          </Button>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-4 p-4 md:p-6">
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {variants.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm font-medium">
              {t("products.variants.empty.title")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("products.variants.empty.description")}
            </p>
            <Button size="sm" variant="outline" onClick={onAddVariant}>
              <Plus className="mr-2 h-4 w-4" />
              {t("products.buttons.addVariant")}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {variants.map((variant, index) => renderVariant(variant, index))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
