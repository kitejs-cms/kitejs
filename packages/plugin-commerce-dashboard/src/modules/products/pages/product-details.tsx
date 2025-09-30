import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileJson, Plus, Trash2 } from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  JsonModal,
  Label,
  LanguageTabs,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  SkeletonPage,
  TagsInput,
  Textarea,
} from "@kitejs-cms/dashboard-core";
import { ProductStatus } from "@kitejs-cms/plugin-commerce-api";

import { useProductDetails } from "../hooks/use-product-details";

const toInputDate = (value?: string | null) =>
  value ? new Date(value).toISOString().slice(0, 16) : "";

const fromInputDate = (value: string): string | null =>
  value ? new Date(value).toISOString() : null;

export function CommerceProductDetailsPage() {
  const { t } = useTranslation("commerce");
  const [jsonView, setJsonView] = useState(false);

  const {
    product,
    primaryTranslation,
    activeLanguage,
    setActiveLanguage,
    handleAddLanguage,
    updateTranslation,
    handleSlugChange,
    handleSettingsChange,
    handleAddVariant,
    handleVariantChange,
    handleRemoveVariant,
    handleCancel,
    handleSave,
    isCreating,
    hasChanges,
    loadingProduct,
    savingProduct,
  } = useProductDetails();

  if (loadingProduct || !product || !primaryTranslation) {
    return <SkeletonPage />;
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col">
      <div className="flex-1 p-4 md:p-6">
        <JsonModal
          isOpen={jsonView}
          onClose={() => setJsonView(false)}
          data={product}
        />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {isCreating
                ? t("products.create.title")
                : primaryTranslation.title?.trim() ||
                  t("products.details.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isCreating
                ? t("products.create.description")
                : t("products.details.description")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setJsonView(true)}
              className="flex items-center gap-2"
            >
              <FileJson className="h-4 w-4" />
              {t("products.buttons.viewJson", "View JSON")}
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              {t("products.buttons.cancel", "Cancel")}
            </Button>
            <Button onClick={handleSave} disabled={savingProduct || !hasChanges}>
              {savingProduct
                ? t("products.buttons.saving", "Saving...")
                : t("products.buttons.save", "Save product")}
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <LanguageTabs
            languages={Object.keys(product.translations)}
            activeLanguage={activeLanguage}
            onLanguageChange={(lang) => setActiveLanguage(lang)}
            onAddLanguage={handleAddLanguage}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
          <div className="space-y-4 md:space-y-6 lg:col-span-2">
            <Card className="w-full gap-0 py-0 shadow-neutral-50">
              <CardHeader className="rounded-t-xl bg-secondary py-4 md:py-6 text-primary">
                <CardTitle>{t("products.details.form.title")}</CardTitle>
                <CardDescription>
                  {t("products.details.form.description")}
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-4 p-4 md:p-6">
                <div>
                  <Label className="mb-2 block" htmlFor="product-title">
                    {t("products.details.form.fields.title")}
                  </Label>
                  <Input
                    id="product-title"
                    value={primaryTranslation.title ?? ""}
                    onChange={(event) =>
                      updateTranslation(activeLanguage, "title", event.target.value)
                    }
                  />
                </div>
                <div>
                  <Label className="mb-2 block" htmlFor="product-subtitle">
                    {t("products.details.form.fields.subtitle")}
                  </Label>
                  <Input
                    id="product-subtitle"
                    value={primaryTranslation.subtitle ?? ""}
                    onChange={(event) =>
                      updateTranslation(
                        activeLanguage,
                        "subtitle",
                        event.target.value
                      )
                    }
                  />
                </div>
                <div>
                  <Label className="mb-2 block" htmlFor="product-summary">
                    {t("products.details.form.fields.summary")}
                  </Label>
                  <Textarea
                    id="product-summary"
                    value={primaryTranslation.summary ?? ""}
                    onChange={(event) =>
                      updateTranslation(
                        activeLanguage,
                        "summary",
                        event.target.value
                      )
                    }
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="mb-2 block" htmlFor="product-description">
                    {t("products.details.form.fields.description")}
                  </Label>
                  <Textarea
                    id="product-description"
                    value={primaryTranslation.description ?? ""}
                    onChange={(event) =>
                      updateTranslation(
                        activeLanguage,
                        "description",
                        event.target.value
                      )
                    }
                    rows={6}
                  />
                </div>
                <div>
                  <Label className="mb-2 block" htmlFor="product-slug">
                    {t("products.details.form.fields.slug")}
                  </Label>
                  <Input
                    id="product-slug"
                    value={primaryTranslation.slug ?? ""}
                    onChange={(event) =>
                      handleSlugChange(activeLanguage, event.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 md:space-y-6">
            <Card className="w-full gap-0 py-0 shadow-neutral-50">
              <CardHeader className="rounded-t-xl bg-secondary py-4 md:py-6 text-primary">
                <CardTitle>{t("products.details.settings.title")}</CardTitle>
                <CardDescription>
                  {t("products.details.settings.description")}
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-4 p-4 md:p-6">
                <div>
                  <Label className="mb-2 block" htmlFor="product-status">
                    {t("products.details.settings.status")}
                  </Label>
                  <Select
                    value={product.status}
                    onValueChange={(value) =>
                      handleSettingsChange("status", value as ProductStatus)
                    }
                  >
                    <SelectTrigger id="product-status" className="w-full">
                      <SelectValue placeholder={t("products.details.settings.status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ProductStatus.Draft}>
                        {t("products.status.draft")}
                      </SelectItem>
                      <SelectItem value={ProductStatus.Active}>
                        {t("products.status.active")}
                      </SelectItem>
                      <SelectItem value={ProductStatus.Archived}>
                        {t("products.status.archived")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block" htmlFor="product-default-currency">
                    {t("products.details.settings.defaultCurrency")}
                  </Label>
                  <Input
                    id="product-default-currency"
                    value={product.defaultCurrency ?? ""}
                    onChange={(event) =>
                      handleSettingsChange("defaultCurrency", event.target.value)
                    }
                  />
                </div>
                <div>
                  <Label className="mb-2 block" htmlFor="product-publish-at">
                    {t("products.details.settings.publishAt")}
                  </Label>
                  <Input
                    id="product-publish-at"
                    type="datetime-local"
                    value={toInputDate(product.publishAt)}
                    onChange={(event) =>
                      handleSettingsChange(
                        "publishAt",
                        fromInputDate(event.target.value)
                      )
                    }
                  />
                </div>
                <div>
                  <Label className="mb-2 block" htmlFor="product-expire-at">
                    {t("products.details.settings.expireAt")}
                  </Label>
                  <Input
                    id="product-expire-at"
                    type="datetime-local"
                    value={toInputDate(product.expireAt)}
                    onChange={(event) =>
                      handleSettingsChange(
                        "expireAt",
                        fromInputDate(event.target.value)
                      )
                    }
                  />
                </div>
                <div>
                  <Label className="mb-2 block" htmlFor="product-tags">
                    {t("products.details.settings.tags")}
                  </Label>
                  <TagsInput
                    id="product-tags"
                    value={product.tags}
                    onChange={(value) => handleSettingsChange("tags", value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="w-full gap-0 py-0 shadow-neutral-50">
              <CardHeader className="rounded-t-xl bg-secondary py-4 md:py-6 text-primary">
                <CardTitle>{t("products.details.variants.title")}</CardTitle>
                <CardDescription>
                  {t("products.details.variants.description")}
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-4 p-4 md:p-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex w-full items-center justify-center gap-2"
                  onClick={handleAddVariant}
                >
                  <Plus className="h-4 w-4" />
                  {t("products.details.variants.add")}
                </Button>

                {product.variants.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    {t("products.details.variants.empty")}
                  </div>
                ) : (
                  product.variants.map((variant, index) => (
                    <div
                      key={variant.localId}
                      className="space-y-4 rounded-lg border border-border p-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">
                          {t("products.details.variants.itemTitle", {
                            index: index + 1,
                          })}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveVariant(variant.localId)}
                          className="flex items-center gap-2 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          {t("products.details.variants.remove")}
                        </Button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label
                            className="mb-2 block"
                            htmlFor={`variant-name-${variant.localId}`}
                          >
                            {t("products.details.variants.fields.name")}
                          </Label>
                          <Input
                            id={`variant-name-${variant.localId}`}
                            value={variant.title}
                            onChange={(event) =>
                              handleVariantChange(
                                variant.localId,
                                "title",
                                event.target.value
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label
                            className="mb-2 block"
                            htmlFor={`variant-sku-${variant.localId}`}
                          >
                            {t("products.details.variants.fields.sku")}
                          </Label>
                          <Input
                            id={`variant-sku-${variant.localId}`}
                            value={variant.sku}
                            onChange={(event) =>
                              handleVariantChange(
                                variant.localId,
                                "sku",
                                event.target.value
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label
                            className="mb-2 block"
                            htmlFor={`variant-barcode-${variant.localId}`}
                          >
                            {t("products.details.variants.fields.barcode")}
                          </Label>
                          <Input
                            id={`variant-barcode-${variant.localId}`}
                            value={variant.barcode ?? ""}
                            onChange={(event) =>
                              handleVariantChange(
                                variant.localId,
                                "barcode",
                                event.target.value
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label
                            className="mb-2 block"
                            htmlFor={`variant-inventory-${variant.localId}`}
                          >
                            {t("products.details.variants.fields.inventory")}
                          </Label>
                          <Input
                            id={`variant-inventory-${variant.localId}`}
                            type="number"
                            value={variant.inventory ?? ""}
                            onChange={(event) =>
                              handleVariantChange(
                                variant.localId,
                                "inventory",
                                event.target.value
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label
                            className="mb-2 block"
                            htmlFor={`variant-price-${variant.localId}`}
                          >
                            {t("products.details.variants.fields.price")}
                          </Label>
                          <Input
                            id={`variant-price-${variant.localId}`}
                            type="number"
                            value={variant.price ?? ""}
                            onChange={(event) =>
                              handleVariantChange(
                                variant.localId,
                                "price",
                                event.target.value
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label
                            className="mb-2 block"
                            htmlFor={`variant-compare-${variant.localId}`}
                          >
                            {t("products.details.variants.fields.compareAt")}
                          </Label>
                          <Input
                            id={`variant-compare-${variant.localId}`}
                            type="number"
                            value={variant.compareAtPrice ?? ""}
                            onChange={(event) =>
                              handleVariantChange(
                                variant.localId,
                                "compareAtPrice",
                                event.target.value
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label
                            className="mb-2 block"
                            htmlFor={`variant-currency-${variant.localId}`}
                          >
                            {t("products.details.variants.fields.currency")}
                          </Label>
                          <Input
                            id={`variant-currency-${variant.localId}`}
                            value={variant.currency ?? ""}
                            onChange={(event) =>
                              handleVariantChange(
                                variant.localId,
                                "currency",
                                event.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 border-t bg-background p-4">
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={handleCancel}>
            {t("products.buttons.cancel", "Cancel")}
          </Button>
          <Button onClick={handleSave} disabled={savingProduct || !hasChanges}>
            {savingProduct
              ? t("products.buttons.saving", "Saving...")
              : t("products.buttons.save", "Save product")}
          </Button>
        </div>
      </div>
    </div>
  );
}
