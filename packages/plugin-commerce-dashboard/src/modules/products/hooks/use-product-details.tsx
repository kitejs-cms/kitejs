import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  useApi,
  useBreadcrumb,
  useSettingsContext,
} from "@kitejs-cms/dashboard-core";
import {
  ProductStatus,
  type ProductBaseModel,
  type ProductResponseModel,
  type ProductVariantModel,
} from "@kitejs-cms/plugin-commerce-api";

type ProductTranslation = {
  title?: string;
  subtitle?: string;
  summary?: string;
  description?: string;
  slug?: string;
};

type ProductDetailModel = ProductResponseModel & {
  status?: ProductStatus;
  tags?: string[];
  defaultCurrency?: string;
  publishAt?: string | null;
  expireAt?: string | null;
  variants?: ProductVariantModel[];
};

export type VariantForm = {
  localId: string;
  id?: string;
  title: string;
  sku: string;
  barcode?: string;
  inventory?: string;
  price?: string;
  compareAtPrice?: string;
  currency?: string;
};

export type ProductFormState = {
  id?: string;
  status: ProductStatus;
  defaultCurrency?: string;
  publishAt?: string | null;
  expireAt?: string | null;
  tags: string[];
  translations: Record<string, ProductTranslation>;
  variants: VariantForm[];
};

type ProductUpsertPayload = Pick<
  ProductBaseModel,
  |
    "title"
  | "subtitle"
  | "summary"
  | "description"
  | "slug"
  | "language"
  | "status"
  | "tags"
  | "publishAt"
  | "expireAt"
  | "variants"
  | "defaultCurrency"
>;

export interface UseProductDetailsResult {
  product: ProductFormState | null;
  primaryTranslation: ProductTranslation | null;
  activeLanguage: string;
  setActiveLanguage(language: string): void;
  handleAddLanguage(language: string): void;
  updateTranslation(
    language: string,
    field: keyof ProductTranslation,
    value: string
  ): void;
  handleSlugChange(language: string, value: string): void;
  handleSettingsChange(
    field: "status" | "defaultCurrency" | "publishAt" | "expireAt" | "tags",
    value: string | string[] | null
  ): void;
  handleAddVariant(): void;
  handleVariantChange(
    localId: string,
    field: keyof VariantForm,
    value: string
  ): void;
  handleRemoveVariant(localId: string): void;
  handleCancel(): void;
  handleSave(): Promise<void>;
  isCreating: boolean;
  hasChanges: boolean;
  loadingProduct: boolean;
  savingProduct: boolean;
}

const createLocalId = () => Math.random().toString(36).slice(2);

const generateSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const createEmptyTranslation = (): ProductTranslation => ({
  title: "",
  subtitle: "",
  summary: "",
  description: "",
  slug: "",
});

const createEmptyProduct = (
  language: string,
  defaultCurrency?: string
): ProductFormState => ({
  status: ProductStatus.Draft,
  defaultCurrency,
  publishAt: null,
  expireAt: null,
  tags: [],
  translations: { [language]: createEmptyTranslation() },
  variants: [],
});

const mapVariantResponse = (variant: ProductVariantModel): VariantForm => {
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
  } satisfies VariantForm;
};

const mapProductResponseToForm = (
  response: ProductDetailModel,
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
      } satisfies ProductTranslation;
    }
  }

  return {
    id: response.id,
    status: response.status ?? ProductStatus.Draft,
    defaultCurrency: response.defaultCurrency ?? "",
    publishAt: response.publishAt ?? null,
    expireAt: response.expireAt ?? null,
    tags: response.tags ?? [],
    translations: mappedTranslations,
    variants: (response.variants ?? []).map(mapVariantResponse),
  } satisfies ProductFormState;
};

export function useProductDetails(): UseProductDetailsResult {
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
  const defaultCurrency = cmsSettings?.defaultCurrency;

  const isCreating = !id || location.pathname.endsWith("/new");

  const [product, setProduct] = useState<ProductFormState | null>(null);
  const [activeLanguage, setActiveLanguage] = useState(defaultLanguage);
  const [hasChanges, setHasChanges] = useState(false);

  const { loading: loadingProduct, fetchData: fetchProduct } =
    useApi<ProductDetailModel>();
  const { loading: savingProduct, fetchData: saveProduct } =
    useApi<ProductDetailModel>();

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
        const nextLanguage = languages.includes(defaultLanguage)
          ? defaultLanguage
          : languages[0];
        if (nextLanguage) {
          setActiveLanguage(nextLanguage);
        }
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
    } else if (product && primaryTranslation) {
      const title =
        primaryTranslation.title?.trim() ||
        primaryTranslation.slug?.trim() ||
        t("products.details.breadcrumb");
      baseBreadcrumb.push({ label: title, path: location.pathname });
    }

    setBreadcrumb(baseBreadcrumb);
  }, [
    isCreating,
    location.pathname,
    primaryTranslation,
    product,
    setBreadcrumb,
    t,
  ]);

  useEffect(() => {
    if (isCreating) {
      const initial = createEmptyProduct(defaultLanguage, defaultCurrency);
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
  }, [defaultCurrency, defaultLanguage, fetchProduct, id, isCreating]);

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
        const current =
          previous.translations[language] ?? createEmptyTranslation();
        const nextTranslation: ProductTranslation = {
          ...current,
          [field]: value,
        };

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
      field:
        | "status"
        | "defaultCurrency"
        | "publishAt"
        | "expireAt"
        | "tags",
      value: string | string[] | null
    ) => {
      setProduct((previous) => {
        if (!previous) return previous;
        if (field === "tags") {
          return { ...previous, tags: (value as string[]) ?? [] };
        }
        if (field === "status") {
          return {
            ...previous,
            status: (value as ProductStatus) ?? ProductStatus.Draft,
          };
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
      status: product.status ?? ProductStatus.Draft,
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
          } satisfies ProductVariantModel;
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
    activeLanguage,
    defaultLanguage,
    isCreating,
    navigate,
    product,
    saveProduct,
    t,
  ]);

  return {
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
  } satisfies UseProductDetailsResult;
}

