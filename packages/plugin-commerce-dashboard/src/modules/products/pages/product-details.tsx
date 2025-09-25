import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  JsonModal,
  Label,
  LanguageTabs,
  Separator,
  SkeletonPage,
  Textarea,
} from "@kitejs-cms/dashboard-core";
import { useProductDetails } from "../hooks/use-product-details";
import { ProductSeoSection } from "../components/seo-section";
import { ProductSettingsSection } from "../components/settings-section";
import { ProductUnsavedChangesDialog } from "../components/unsaved-changes-dialog";
import { ProductVariantsSection } from "../components/product-variants-section";

export function CommerceProductDetailsPage() {
  const { t } = useTranslation("commerce");
  const [jsonView, setJsonView] = useState(false);

  const {
    data,
    loading,
    activeLang,
    setActiveLang,
    onAddLanguage,
    onChange,
    onSeoChange,
    onSettingsChange,
    addVariant,
    updateVariant,
    removeVariant,
    addVariantPrice,
    updateVariantPrice,
    removeVariantPrice,
    hasChanges,
    handleNavigation,
    handleSave,
    showUnsavedAlert,
    confirmDiscard,
    closeUnsavedAlert,
    formErrors,
  } = useProductDetails();

  const translation = useMemo(() => {
    if (!data) {
      return {
        title: "",
        subtitle: "",
        summary: "",
        description: "",
        slug: "",
      };
    }
    return data.translations?.[activeLang] ?? {
      title: "",
      subtitle: "",
      summary: "",
      description: "",
      slug: "",
    };
  }, [activeLang, data]);

  const resolveUserValue = (value: unknown) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      const user = value as { email?: string; name?: string; _id?: string };
      return user.email ?? user.name ?? user._id ?? "";
    }
    return "";
  };

  if (loading || !data) {
    return <SkeletonPage />;
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col">
      <div className="flex-1 p-4 md:p-6">
        <JsonModal
          isOpen={jsonView}
          onClose={() => setJsonView(false)}
          data={data}
        />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <LanguageTabs
            languages={Object.keys(data.translations ?? {})}
            activeLanguage={activeLang}
            onLanguageChange={setActiveLang}
            onAddLanguage={onAddLanguage}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
          <div className="space-y-4 md:space-y-6 lg:col-span-2">
            <Card className="w-full gap-0 py-0 shadow-neutral-50">
              <CardHeader className="rounded-t-xl bg-secondary py-4 md:py-6 text-primary">
                <CardTitle>{t("products.sections.translations")}</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-4 p-4 md:p-6">
                <div>
                  <Label className="mb-2 block" htmlFor="product-title">
                    {t("products.fields.title")}
                  </Label>
                  <Input
                    id="product-title"
                    value={translation.title ?? ""}
                    onChange={(event) => onChange("title", event.target.value)}
                  />
                  {formErrors.title ? (
                    <p className="mt-1 text-sm text-destructive">
                      {formErrors.title}
                    </p>
                  ) : null}
                </div>

                <div>
                  <Label className="mb-2 block" htmlFor="product-subtitle">
                    {t("products.fields.subtitle")}
                  </Label>
                  <Input
                    id="product-subtitle"
                    value={translation.subtitle ?? ""}
                    onChange={(event) =>
                      onChange("subtitle", event.target.value)
                    }
                  />
                </div>

                <div>
                  <Label className="mb-2 block" htmlFor="product-slug">
                    {t("products.fields.slug")}
                  </Label>
                  <Input
                    id="product-slug"
                    value={translation.slug ?? ""}
                    onChange={(event) => onChange("slug", event.target.value)}
                  />
                  {formErrors.slug ? (
                    <p className="mt-1 text-sm text-destructive">
                      {formErrors.slug}
                    </p>
                  ) : null}
                </div>

                <div>
                  <Label className="mb-2 block" htmlFor="product-summary">
                    {t("products.fields.summary")}
                  </Label>
                  <Textarea
                    id="product-summary"
                    value={translation.summary ?? ""}
                    onChange={(event) =>
                      onChange("summary", event.target.value)
                    }
                    className="min-h-[120px]"
                  />
                </div>

                <div>
                  <Label className="mb-2 block" htmlFor="product-description">
                    {t("products.fields.description")}
                  </Label>
                  <Textarea
                    id="product-description"
                    value={translation.description ?? ""}
                    onChange={(event) =>
                      onChange("description", event.target.value)
                    }
                    className="min-h-[160px]"
                  />
                </div>

                {formErrors.apiError ? (
                  <p className="text-sm text-destructive">{formErrors.apiError}</p>
                ) : null}
              </CardContent>
            </Card>

            <ProductVariantsSection
              variants={data.variants ?? []}
              defaultCurrency={data.defaultCurrency ?? undefined}
              error={formErrors.variants}
              onAddVariant={addVariant}
              onRemoveVariant={removeVariant}
              onVariantChange={updateVariant}
              onAddPrice={addVariantPrice}
              onRemovePrice={removeVariantPrice}
              onPriceChange={updateVariantPrice}
            />

            <ProductSeoSection
              activeLang={activeLang}
              translations={data.translations}
              onChange={onSeoChange}
            />
          </div>

          <div className="space-y-6">
            <ProductSettingsSection
              status={typeof data.status === "string" ? data.status : undefined}
              publishAt={(data.publishAt as string | null) ?? null}
              expireAt={(data.expireAt as string | null) ?? null}
              tags={Array.isArray(data.tags) ? (data.tags as string[]) : undefined}
              collectionIds={
                Array.isArray(data.collectionIds)
                  ? (data.collectionIds as string[])
                  : undefined
              }
              defaultCurrency={
                typeof data.defaultCurrency === "string"
                  ? (data.defaultCurrency as string)
                  : undefined
              }
              thumbnail={
                typeof data.thumbnail === "string"
                  ? (data.thumbnail as string)
                  : null
              }
              gallery={Array.isArray(data.gallery) ? (data.gallery as string[]) : undefined}
              createdBy={resolveUserValue(data.createdBy)}
              updatedBy={resolveUserValue(data.updatedBy)}
              onChange={onSettingsChange}
              onViewJson={() => setJsonView(true)}
            />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 mt-6 flex justify-end gap-3 border-t bg-background py-4 px-4 md:px-6">
        <Button
          variant="outline"
          onClick={() => handleNavigation("/commerce/products")}
        >
          {t("products.buttons.cancel")}
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges}>
          {t("products.buttons.save")}
        </Button>
      </div>

      <ProductUnsavedChangesDialog
        isOpen={showUnsavedAlert}
        onClose={closeUnsavedAlert}
        onDiscard={confirmDiscard}
      />
    </div>
  );
}
