import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Badge,
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

export type VariantState = ProductVariantModel & {
  prices?: ProductPriceModel[];
};

export type VariantFieldErrors = Partial<
  Record<"title" | "sku" | "inventoryQuantity" | "gallery", string>
>;

export interface VariantGalleryOption {
  id: string;
  label: string;
  url: string | null;
}

interface VariantsSectionProps {
  variants: VariantState[];
  defaultCurrency: string;
  productGallery: VariantGalleryOption[];
  variantErrors?: VariantFieldErrors[];
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
  onVariantGalleryChange: (index: number, gallery: string[]) => void;
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

const formatPrice = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

export function VariantsSection({
  variants,
  defaultCurrency,
  productGallery,
  variantErrors,
  onAddVariant,
  onRemoveVariant,
  onVariantChange,
  onVariantPriceChange,
  onVariantGalleryChange,
}: VariantsSectionProps) {
  const { t } = useTranslation("commerce");
  const [expanded, setExpanded] = useState<number | null>(null);

  const galleryLookup = useMemo(() => {
    const map = new Map<string, VariantGalleryOption>();
    productGallery.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, [productGallery]);

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
              const selectedGallery = variant.gallery ?? [];
              const preview = selectedGallery.length
                ? galleryLookup.get(selectedGallery[0])
                : undefined;
              const priceLabel = formatPrice(price.amount ?? 0, price.currencyCode);
              const inventoryLabel =
                typeof variant.inventoryQuantity === "number" &&
                variant.inventoryQuantity > 0
                  ? t("products.details.variants.preview.inventoryCount", {
                      count: variant.inventoryQuantity,
                    })
                  : t("products.details.variants.preview.inventoryFallback");
              const isExpanded = expanded === index;
              const errors = variantErrors?.[index];

              const toggleGallerySelection = (assetId: string) => {
                if (selectedGallery.includes(assetId)) {
                  onVariantGalleryChange(
                    index,
                    selectedGallery.filter((entry) => entry !== assetId)
                  );
                } else {
                  onVariantGalleryChange(index, [...selectedGallery, assetId]);
                }
              };

              return (
                <div
                  key={variant.id ?? `${index}`}
                  className="overflow-hidden rounded-xl border border-border bg-background shadow-sm"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                    onClick={() =>
                      setExpanded((prev) => (prev === index ? null : index))
                    }
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border bg-muted">
                        {preview?.url ? (
                          <img
                            src={preview.url}
                            alt={preview.label}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">
                          {variant.title?.trim() ||
                            t("products.details.variants.preview.untitled")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {variant.sku?.trim() ||
                            t("products.details.variants.preview.missingSku")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <Badge variant="outline" className="text-xs font-normal">
                          {priceLabel}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {inventoryLabel}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRemoveVariant(index);
                        }}
                        aria-label={t("products.details.variants.remove")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="space-y-5 border-t px-4 py-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`variant-title-${index}`}>
                            {t("products.details.variants.fields.name")}
                          </Label>
                          <Input
                            id={`variant-title-${index}`}
                            value={variant.title ?? ""}
                            aria-invalid={Boolean(errors?.title)}
                            onChange={(event) =>
                              onVariantChange(index, "title", event.target.value)
                            }
                          />
                          {errors?.title && (
                            <p className="text-xs text-destructive">{errors.title}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`variant-sku-${index}`}>
                            {t("products.details.variants.fields.sku")}
                          </Label>
                          <Input
                            id={`variant-sku-${index}`}
                            value={variant.sku ?? ""}
                            aria-invalid={Boolean(errors?.sku)}
                            onChange={(event) =>
                              onVariantChange(index, "sku", event.target.value)
                            }
                          />
                          {errors?.sku && (
                            <p className="text-xs text-destructive">{errors.sku}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`variant-barcode-${index}`}>
                            {t("products.details.variants.fields.barcode")}
                          </Label>
                          <Input
                            id={`variant-barcode-${index}`}
                            value={variant.barcode ?? ""}
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

                      <div className="space-y-3">
                        <div>
                          <Label>{t("products.details.variants.fields.media")}</Label>
                          <p className="text-xs text-muted-foreground">
                            {t("products.details.variants.fields.mediaDescription")}
                          </p>
                        </div>
                        {productGallery.length > 0 ? (
                          <div className="flex flex-wrap gap-3">
                            {productGallery.map((asset) => {
                              const isSelected = selectedGallery.includes(asset.id);
                              return (
                                <button
                                  type="button"
                                  key={asset.id}
                                  className={`relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border transition ${
                                    isSelected
                                      ? "border-primary ring-2 ring-primary"
                                      : "border-muted bg-muted"
                                  }`}
                                  onClick={() => toggleGallerySelection(asset.id)}
                                  aria-pressed={isSelected}
                                >
                                  {asset.url ? (
                                    <img
                                      src={asset.url}
                                      alt={asset.label}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                  )}
                                  {isSelected && (
                                    <span className="absolute right-1 top-1 rounded-full bg-primary p-1 text-primary-foreground">
                                      <Check className="h-3 w-3" />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {t("products.details.variants.fields.mediaEmpty")}
                          </p>
                        )}
                        {errors?.gallery && (
                          <p className="text-xs text-destructive">{errors.gallery}</p>
                        )}
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
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
