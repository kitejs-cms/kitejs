import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
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
  useApi,
  useBreadcrumb,
  useSettingsContext,
} from "@kitejs-cms/dashboard-core";
import { FileJson, Plus, Trash2 } from "lucide-react";

type ProductStatus = "draft" | "active" | "archived";

interface ProductTranslation {
  title?: string;
  subtitle?: string;
  summary?: string;
  description?: string;
  slug?: string;
}

interface ProductVariantPriceResponse {
  currencyCode?: string;
  amount?: number;
  compareAtAmount?: number;
}

interface ProductVariantResponse {
  id?: string;
  title?: string;
  sku?: string;
  barcode?: string;
  inventoryQuantity?: number;
  prices?: ProductVariantPriceResponse[];
}

interface ProductDetailResponse {
  id: string;
  status?: ProductStatus;
  tags?: string[];
  defaultCurrency?: string;
  publishAt?: string | null;
  expireAt?: string | null;
  slugs?: Record<string, string>;
  translations: Record<string, ProductTranslation>;
  variants?: ProductVariantResponse[];
}

interface VariantForm {
  localId: string;
  id?: string;
  title: string;
  sku: string;
  barcode?: string;
  inventory?: string;
  price?: string;
  compareAtPrice?: string;
  currency?: string;
}

interface ProductFormState {
  id?: string;
  status: ProductStatus;
  defaultCurrency?: string;
  publishAt?: string | null;
  expireAt?: string | null;
  tags: string[];
  translations: Record<string, ProductTranslation>;
  variants: VariantForm[];
}

interface ProductUpsertPayload {
  title: string;
  subtitle?: string;
  summary?: string;
  description?: string;
  slug: string;
  language: string;
  status: ProductStatus;
  tags?: string[];
  publishAt?: string | null;
  expireAt?: string | null;
  defaultCurrency?: string;
  variants?: {
    id?: string;
    title: string;
    sku: string;
    barcode?: string;
    inventoryQuantity?: number;
    prices?: {
      currencyCode: string;
      amount: number;
      compareAtAmount?: number;
    }[];
  }[];
}

const createLocalId = () => Math.random().toString(36).slice(2);

const createEmptyTranslation = (): ProductTranslation => ({
  title: "",
  subtitle: "",
  summary: "",
  description: "",
  slug: "",
});

const createEmptyProduct = (language: string, currency?: string): ProductFormState => ({
  status: "draft",
  defaultCurrency: currency,
  publishAt: null,
  expireAt: null,
  tags: [],
  translations: { [language]: createEmptyTranslation() },
  variants: [],
});

const mapVariantResponse = (variant: ProductVariantResponse): VariantForm => {
  const price = variant.prices?.[0];
  return {
    localId: variant.id ?? createLocalId(),
    id: variant.id,
    title: typeof variant.title === "string" ? variant.title : "",
    sku: typeof variant.sku === "string" ? variant.sku : "",
    barcode: variant.barcode ?? "",
    inventory:
      typeof variant.inventoryQuantity === "number"
        ? String(variant.inventoryQuantity)
        : "",
    price:
      price && typeof price.amount === "number" ? String(price.amount) : "",
    compareAtPrice:
      price && typeof price.compareAtAmount === "number"
        ? String(price.compareAtAmount)
        : "",
    currency: price?.currencyCode ?? "",
  };
};

const mapProductResponseToForm = (
  response: ProductDetailResponse,
  fallbackLanguage: string
): ProductFormState => {
  const mappedTranslations: Record<string, ProductTranslation> = {};
  const entries = Object.entries(response.translations ?? {});

  if (entries.length === 0) {
    mappedTranslations[fallbackLanguage] = createEmptyTranslation();
  } else {
    for (const [lang, value] of entries) {
      const translation = value ?? {};
      mappedTranslations[lang] = {
        title: typeof translation.title === "string" ? translation.title : "",
        subtitle:
          typeof translation.subtitle === "string" ? translation.subtitle : "",
        summary:
          typeof translation.summary === "string" ? translation.summary : "",
        description:
          typeof translation.description === "string"
            ? translation.description
            : "",
        slug:
          typeof translation.slug === "string"
            ? translation.slug
            : response.slugs?.[lang] ?? "",
      };
    }
  }

  return {
    id: response.id,
    status: response.status ?? "draft",
    defaultCurrency: response.defaultCurrency ?? "",
    publishAt: response.publishAt ?? null,
    expireAt: response.expireAt ?? null,
    tags: response.tags ?? [],
    translations: mappedTranslations,
    variants: (response.variants ?? []).map(mapVariantResponse),
  };
};

const toInputDate = (value?: string | null) =>
  value ? new Date(value).toISOString().slice(0, 16) : "";

const fromInputDate = (value: string): string | null =>
  value ? new Date(value).toISOString() : null;

const generateSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function CommerceProductDetailsPage() {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation("commerce");
  const { setBreadcrumb } = useBreadcrumb();
  const { cmsSettings } = useSettingsContext();

  const defaultLanguage = useMemo(
    () => cmsSettings?.defaultLanguage ?? "en",
    [cmsSettings?.defaultLanguage]
  );

  const isCreating = !id || location.pathname.endsWith("/new");

  const [product, setProduct] = useState<ProductFormState | null>(null);
  const [activeLanguage, setActiveLanguage] = useState(defaultLanguage);
  const [hasChanges, setHasChanges] = useState(false);
  const [jsonView, setJsonView] = useState(false);

  const { loading: loadingProduct, fetchData: fetchProduct } =
    useApi<ProductDetailResponse>();
  const { loading: savingProduct, fetchData: saveProduct } =
    useApi<ProductDetailResponse>();

  const primaryTranslation = useMemo(() => {
    if (!product) return null;
    return (
      product.translations[activeLanguage] ??
      product.translations[defaultLanguage] ??
      Object.values(product.translations)[0] ?? null
    );
  }, [product, activeLanguage, defaultLanguage]);

  useEffect(() => {
    if (product) {
      const languages = Object.keys(product.translations);
      if (!languages.includes(activeLanguage)) {
        setActiveLanguage(languages[0] ?? defaultLanguage);
      }
    }
  }, [product, activeLanguage, defaultLanguage]);

  useEffect(() => {
    const baseBreadcrumb = [
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.products"), path: "/commerce/products" },
    ];

    if (isCreating) {
      baseBreadcrumb.push({
        label: t("products.create.breadcrumb"),
        path: location.pathname,
      });
    } else if (product) {
      const title =
        primaryTranslation?.title?.trim() ||
        primaryTranslation?.slug?.trim() ||
        t("products.details.breadcrumb");
      baseBreadcrumb.push({ label: title, path: location.pathname });
    }

    setBreadcrumb(baseBreadcrumb);
  }, [
    setBreadcrumb,
    t,
    location.pathname,
    isCreating,
    product,
    primaryTranslation,
  ]);

  useEffect(() => {
    if (isCreating) {
      const initial = createEmptyProduct(defaultLanguage);
      setProduct(initial);
      setActiveLanguage(defaultLanguage);
      setHasChanges(false);
      return;
    }

    if (id) {
      (async () => {
        const result = await fetchProduct(`commerce/products/${id}`);
        if (result?.data) {
          const mapped = mapProductResponseToForm(result.data, defaultLanguage);
          setProduct(mapped);
          const languages = Object.keys(mapped.translations);
          if (languages.length) {
            setActiveLanguage(
              languages.includes(defaultLanguage) ? defaultLanguage : languages[0]
            );
          }
          setHasChanges(false);
        }
      })();
    }
  }, [defaultLanguage, fetchProduct, id, isCreating]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (hasChanges) {
        event.preventDefault();
        event.returnValue = t("products.errors.unsavedChanges", {
          defaultValue: "You have unsaved product changes.",
        });
      }
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges, t]);

  const updateTranslation = useCallback(
    (language: string, field: keyof ProductTranslation, value: string) => {
      setProduct((previous) => {
        if (!previous) return previous;
        const current = previous.translations[language] ?? createEmptyTranslation();
        const nextTranslation = { ...current, [field]: value };

        if (field === "title" && !current.slug) {
          nextTranslation.slug = generateSlug(value);
        }

        return {
          ...previous,
          translations: {
            ...previous.translations,
            [language]: nextTranslation,
          },
        };
      });
      setHasChanges(true);
    },
    []
  );

  const handleSlugChange = useCallback((language: string, value: string) => {
    setProduct((previous) => {
      if (!previous) return previous;
      const current = previous.translations[language] ?? createEmptyTranslation();
      return {
        ...previous,
        translations: {
          ...previous.translations,
          [language]: { ...current, slug: value },
        },
      };
    });
    setHasChanges(true);
  }, []);

  const handleSettingsChange = useCallback(
    (
      field: keyof Pick<
        ProductFormState,
        "status" | "defaultCurrency" | "publishAt" | "expireAt" | "tags"
      >,
      value: string | string[] | null
    ) => {
      setProduct((previous) => {
        if (!previous) return previous;
        if (field === "tags") {
          return { ...previous, tags: (value as string[]) ?? [] };
        }
        return { ...previous, [field]: value as never };
      });
      setHasChanges(true);
    },
    []
  );

  const handleAddLanguage = useCallback((language: string) => {
    setProduct((previous) => {
      if (!previous) return previous;
      if (previous.translations[language]) {
        setActiveLanguage(language);
        return previous;
      }
      return {
        ...previous,
        translations: {
          ...previous.translations,
          [language]: createEmptyTranslation(),
        },
      };
    });
    setActiveLanguage(language);
    setHasChanges(true);
  }, []);

  const handleAddVariant = useCallback(() => {
    setProduct((previous) => {
      if (!previous) return previous;
      const currency = previous.defaultCurrency || "";
      const newVariant: VariantForm = {
        localId: createLocalId(),
        title: "",
        sku: "",
        barcode: "",
        inventory: "",
        price: "",
        compareAtPrice: "",
        currency,
      };
      return { ...previous, variants: [...previous.variants, newVariant] };
    });
    setHasChanges(true);
  }, []);

  const handleVariantChange = useCallback(
    (localId: string, field: keyof VariantForm, value: string) => {
      setProduct((previous) => {
        if (!previous) return previous;
        const variants = previous.variants.map((variant) =>
          variant.localId === localId ? { ...variant, [field]: value } : variant
        );
        return { ...previous, variants };
      });
      setHasChanges(true);
    },
    []
  );

  const handleRemoveVariant = useCallback((localId: string) => {
    setProduct((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        variants: previous.variants.filter((variant) => variant.localId !== localId),
      };
    });
    setHasChanges(true);
  }, []);

  const handleCancel = useCallback(() => {
    if (hasChanges) {
      const confirmMessage = t("products.errors.discardChanges", {
        defaultValue: "Discard unsaved changes?",
      });
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }
    navigate(-1);
  }, [hasChanges, navigate, t]);

  const handleSave = useCallback(async () => {
    if (!product) return;
    const translation = product.translations[activeLanguage];
    if (!translation?.title?.trim()) {
      toast.error(
        t("products.errors.titleRequired", "Title is required for this language.")
      );
      return;
    }
    if (!translation.slug?.trim()) {
      toast.error(
        t("products.errors.slugRequired", "Slug is required for this language.")
      );
      return;
    }

    const payload: ProductUpsertPayload = {
      title: translation.title.trim(),
      subtitle: translation.subtitle?.trim() || undefined,
      summary: translation.summary?.trim() || undefined,
      description: translation.description?.trim() || undefined,
      slug: translation.slug.trim(),
      language: activeLanguage,
      status: product.status ?? "draft",
      tags: product.tags,
      publishAt: product.publishAt ?? undefined,
      expireAt: product.expireAt ?? undefined,
      defaultCurrency: product.defaultCurrency || undefined,
      variants: product.variants
        .filter((variant) => variant.title.trim() && variant.sku.trim())
        .map((variant) => {
          const parsedAmount = Number(variant.price);
          const parsedCompare = Number(variant.compareAtPrice);
          return {
            id: variant.id,
            title: variant.title.trim(),
            sku: variant.sku.trim(),
            barcode: variant.barcode?.trim() || undefined,
            inventoryQuantity:
              variant.inventory && !Number.isNaN(Number(variant.inventory))
                ? Number(variant.inventory)
                : undefined,
            prices:
              variant.price && !Number.isNaN(parsedAmount)
                ? [
                    {
                      currencyCode:
                        variant.currency?.trim() || product.defaultCurrency || "",
                      amount: parsedAmount,
                      compareAtAmount:
                        variant.compareAtPrice && !Number.isNaN(parsedCompare)
                          ? parsedCompare
                          : undefined,
                    },
                  ]
                : undefined,
          };
        }),
    };

    const toastId = toast.loading(
      t("products.details.notifications.saving", "Saving product...")
    );

    try {
      const endpoint = isCreating
        ? "commerce/products"
        : `commerce/products/${product.id}`;
      const method = isCreating ? "POST" : "PUT";
      const result = await saveProduct(endpoint, method, payload);

      if (result?.data) {
        toast.success(
          t(
            `products.details.notifications.${isCreating ? "created" : "saved"}`,
            {
              defaultValue: isCreating
                ? "Product created successfully."
                : "Product saved successfully.",
            }
          ),
          { id: toastId }
        );

        const mapped = mapProductResponseToForm(result.data, defaultLanguage);
        setProduct(mapped);
        setHasChanges(false);

        if (isCreating && result.data.id) {
          navigate(`/commerce/products/${result.data.id}`);
        }
      } else {
        toast.error(
          t("products.errors.saveFailed", "Unable to save product."),
          { id: toastId }
        );
      }
    } catch (error) {
      console.error("Failed to save product", error);
      toast.error(
        t("products.errors.saveFailed", "Unable to save product."),
        { id: toastId }
      );
    }
  }, [
    product,
    activeLanguage,
    t,
    isCreating,
    saveProduct,
    defaultLanguage,
    navigate,
  ]);

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
            <Button
              onClick={handleSave}
              disabled={savingProduct || !hasChanges}
            >
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
                      <SelectItem value="draft">
                        {t("products.status.draft")}
                      </SelectItem>
                      <SelectItem value="active">
                        {t("products.status.active")}
                      </SelectItem>
                      <SelectItem value="archived">
                        {t("products.status.archived")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block" htmlFor="product-default-currency">
                    {t("products.details.settings.currency")}
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
                        event.target.value ? fromInputDate(event.target.value) : null
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
                        event.target.value ? fromInputDate(event.target.value) : null
                      )
                    }
                  />
                </div>
                <div>
                  <Label className="mb-2 block">
                    {t("products.details.settings.tags")}
                  </Label>
                  <TagsInput
                    key={product.tags.join(",")}
                    initialTags={product.tags}
                    onChange={(tags) => handleSettingsChange("tags", tags)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-6 w-full gap-0 py-0 shadow-neutral-50">
          <CardHeader className="flex flex-col gap-2 rounded-t-xl bg-secondary py-4 md:py-6 text-primary sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t("products.details.variants.title")}</CardTitle>
              <CardDescription>
                {t("products.details.variants.description")}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleAddVariant}>
              <Plus className="mr-2 h-4 w-4" />
              {t("products.details.variants.add")}
            </Button>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-4 p-4 md:p-6">
            {product.variants.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
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
                      <Label className="mb-2 block" htmlFor={`variant-name-${variant.localId}`}>
                        {t("products.details.variants.fields.name")}
                      </Label>
                      <Input
                        id={`variant-name-${variant.localId}`}
                        value={variant.title}
                        onChange={(event) =>
                          handleVariantChange(variant.localId, "title", event.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block" htmlFor={`variant-sku-${variant.localId}`}>
                        {t("products.details.variants.fields.sku")}
                      </Label>
                      <Input
                        id={`variant-sku-${variant.localId}`}
                        value={variant.sku}
                        onChange={(event) =>
                          handleVariantChange(variant.localId, "sku", event.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block" htmlFor={`variant-barcode-${variant.localId}`}>
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
                      <Label className="mb-2 block" htmlFor={`variant-inventory-${variant.localId}`}>
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
                      <Label className="mb-2 block" htmlFor={`variant-price-${variant.localId}`}>
                        {t("products.details.variants.fields.price")}
                      </Label>
                      <Input
                        id={`variant-price-${variant.localId}`}
                        type="number"
                        value={variant.price ?? ""}
                        onChange={(event) =>
                          handleVariantChange(variant.localId, "price", event.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block" htmlFor={`variant-compare-${variant.localId}`}>
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
                      <Label className="mb-2 block" htmlFor={`variant-currency-${variant.localId}`}>
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
