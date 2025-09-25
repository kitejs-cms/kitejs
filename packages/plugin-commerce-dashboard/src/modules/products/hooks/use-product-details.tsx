import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  type ProductSeoModel,
  ProductStatus,
  type ProductResponseModel,
  type ProductVariantModel,
  type ProductPriceModel,
} from "@kitejs-cms/plugin-commerce-api";
import {
  useApi,
  useBreadcrumb,
  useSettingsContext,
} from "@kitejs-cms/dashboard-core";

export type ProductTranslationModel = {
  title: string;
  subtitle?: string;
  summary?: string;
  description?: string;
  slug?: string;
  seo?: ProductSeoModel;
};

export type ProductResponseDetailsModel = ProductResponseModel & {
  status?: string;
  tags?: string[];
  publishAt?: string | null;
  expireAt?: string | null;
  defaultCurrency?: string;
  thumbnail?: string | null;
  gallery?: string[];
  createdBy?: string;
  updatedBy?: string;
  collectionIds?: string[];
  variants?: ProductVariantFormModel[];
  translations: Record<string, ProductTranslationModel>;
  slugs?: Record<string, string>;
  [key: string]: unknown;
};

export interface ProductFormErrors {
  title?: string;
  slug?: string;
  apiError?: string;
  variants?: string;
  [key: string]: string | undefined;
}

export type ProductVariantPriceFormModel = ProductPriceModel & {
  _tempId: string;
};

export type ProductVariantFormModel = ProductVariantModel & {
  _tempId: string;
  prices?: ProductVariantPriceFormModel[];
};

function createTempId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
}

function normalizeVariantPrice(
  price: Record<string, unknown>
): ProductVariantPriceFormModel {
  const currencyValue =
    typeof price.currencyCode === "string" ? price.currencyCode : "";
  const amountValue = Number(price.amount ?? 0);
  const compareAt = price.compareAtAmount;
  const compareAtValue = Number(compareAt);

  return {
    _tempId: createTempId(),
    currencyCode: currencyValue,
    amount: Number.isFinite(amountValue) ? amountValue : Number.NaN,
    ...(compareAt === undefined || compareAt === null
      ? {}
      : {
          compareAtAmount: Number.isFinite(compareAtValue)
            ? compareAtValue
            : undefined,
        }),
  };
}

function normalizeVariant(variant: Record<string, unknown>): ProductVariantFormModel {
  const idValue =
    typeof variant.id === "string"
      ? variant.id
      : typeof variant._id === "string"
        ? variant._id
        : undefined;

  const pricesArray = Array.isArray(variant.prices)
    ? (variant.prices as Record<string, unknown>[]).map((price) =>
        normalizeVariantPrice(price)
      )
    : [];

  const inventoryValue = Number(variant.inventoryQuantity ?? 0);

  return {
    _tempId: createTempId(),
    ...(idValue ? { id: idValue } : {}),
    title: typeof variant.title === "string" ? variant.title : "",
    sku: typeof variant.sku === "string" ? variant.sku : "",
    barcode:
      variant.barcode === undefined || variant.barcode === null
        ? undefined
        : String(variant.barcode),
    inventoryQuantity: Number.isFinite(inventoryValue) ? inventoryValue : 0,
    allowBackorder: Boolean(variant.allowBackorder),
    prices: pricesArray,
  };
}

function normalizeTranslation(
  language: string,
  value: Record<string, unknown> | undefined,
  fallbackSlug: string | undefined
): ProductTranslationModel {
  const translation = (value ?? {}) as ProductTranslationModel;

  return {
    title: translation.title ?? "",
    subtitle: translation.subtitle ?? "",
    summary: translation.summary ?? "",
    description: translation.description ?? "",
    slug: translation.slug ?? fallbackSlug ?? "",
    seo: {
      metaTitle: translation.seo?.metaTitle ?? "",
      metaDescription: translation.seo?.metaDescription ?? "",
      metaKeywords: translation.seo?.metaKeywords ?? [],
      canonicalUrl: translation.seo?.canonicalUrl ?? "",
    },
  };
}

function normalizeProduct(
  product: ProductResponseDetailsModel
): ProductResponseDetailsModel {
  const languages = Object.keys(product.translations ?? {});
  const slugs = product.slugs ?? {};

  const rawCollections =
    (product.collectionIds as string[] | undefined) ??
    ((product as Record<string, unknown>).collections as
      | unknown[]
      | undefined);

  const collectionIds = Array.isArray(rawCollections)
    ? rawCollections
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            const value = item as { id?: string; _id?: string };
            return value.id ?? value._id ?? "";
          }
          return "";
        })
        .filter((value) => Boolean(value))
    : [];

  const variants = Array.isArray((product as Record<string, unknown>).variants)
    ? ((product as Record<string, unknown>).variants as Record<string, unknown>[]).map(
        (variant) => normalizeVariant(variant)
      )
    : [];

  const translations = languages.reduce<Record<string, ProductTranslationModel>>(
    (acc, lang) => {
      acc[lang] = normalizeTranslation(
        lang,
        product.translations?.[lang] as Record<string, unknown>,
        slugs[lang]
      );
      return acc;
    },
    {}
  );

  return {
    ...product,
    status: product.status ?? ProductStatus.Draft,
    tags: Array.isArray(product.tags) ? product.tags : [],
    publishAt: product.publishAt ?? null,
    expireAt: product.expireAt ?? null,
    defaultCurrency: product.defaultCurrency ?? "",
    thumbnail: product.thumbnail ?? "",
    gallery: Array.isArray(product.gallery) ? product.gallery : [],
    collectionIds,
    variants,
    translations,
    slugs,
  };
}

export function useProductDetails() {
  const { t } = useTranslation("commerce");
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { setBreadcrumb } = useBreadcrumb();
  const { cmsSettings } = useSettingsContext();

  const defaultLang = useMemo(
    () => cmsSettings?.defaultLanguage || "en",
    [cmsSettings]
  );

  const isCreating = location.pathname.endsWith("/new") || id === "new";

  const { loading, fetchData } = useApi<ProductResponseDetailsModel>();

  const [localData, setLocalData] =
    useState<ProductResponseDetailsModel | null>(null);
  const [activeLang, setActiveLang] = useState(defaultLang);
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
  const [navigateTo, setNavigateTo] = useState("");
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});

  useEffect(() => {
    const items = [
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.products"), path: "/commerce/products" },
    ];

    if (!isCreating && id && localData) {
      const current = localData.translations?.[activeLang];
      const label = current?.title?.trim() || current?.slug?.trim();
      if (label) {
        items.push({ label, path: `/commerce/products/${localData.id}` });
      }
    } else if (isCreating) {
      items.push({
        label: t("products.create.breadcrumb"),
        path: "/commerce/products/new",
      });
    }

    setBreadcrumb(items);
  }, [
    activeLang,
    id,
    isCreating,
    localData,
    setBreadcrumb,
    t,
  ]);

  useEffect(() => {
    setActiveLang(defaultLang);
  }, [defaultLang]);

  useEffect(() => {
    if (!defaultLang) return;

    if (isCreating) {
      const newProduct: ProductResponseDetailsModel = {
        id: "",
        slugs: {},
        translations: {
          [defaultLang]: {
            title: "",
            subtitle: "",
            summary: "",
            description: "",
            slug: "",
            seo: {
              metaTitle: "",
              metaDescription: "",
              metaKeywords: [],
              canonicalUrl: "",
            },
          },
        },
        status: ProductStatus.Draft,
        tags: [],
        publishAt: null,
        expireAt: null,
        defaultCurrency: "EUR",
        thumbnail: "",
        gallery: [],
        createdBy: "",
        updatedBy: "",
        collectionIds: [],
        variants: [],
      } as ProductResponseDetailsModel;

      setLocalData(newProduct);
      setActiveLang(defaultLang);
      setHasChanges(false);
      return;
    }

    if (id) {
      void (async () => {
        const result = await fetchData(`commerce/products/${id}`);
        if (result?.data) {
          setLocalData(normalizeProduct(result.data));
          setHasChanges(false);
          setFormErrors({});
        }
      })();
    }
  }, [defaultLang, fetchData, id, isCreating]);

  useEffect(() => {
    if (!localData) return;
    const langs = Object.keys(localData.translations ?? {});
    if (!langs.length) return;
    const sorted = [...langs].sort((a, b) =>
      a === defaultLang ? -1 : b === defaultLang ? 1 : a.localeCompare(b)
    );
    if (!langs.includes(activeLang)) {
      setActiveLang(sorted[0]);
    }
  }, [activeLang, defaultLang, localData]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent): string | void => {
      if (hasChanges) {
        event.preventDefault();
        return t("products.unsavedChanges.warning");
      }
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges, t]);

  const closeUnsavedAlert = useCallback(() => {
    setShowUnsavedAlert(false);
  }, []);

  const confirmDiscard = useCallback(() => {
    setShowUnsavedAlert(false);
    setHasChanges(false);
    if (navigateTo) {
      navigate(navigateTo);
    }
  }, [navigate, navigateTo]);

  const onAddLanguage = useCallback((lang: string) => {
    setLocalData((prev) => {
      if (!prev) return prev;
      if (prev.translations?.[lang]) {
        setActiveLang(lang);
        return prev;
      }
      const empty: ProductTranslationModel = {
        title: "",
        subtitle: "",
        summary: "",
        description: "",
        slug: "",
        seo: {
          metaTitle: "",
          metaDescription: "",
          metaKeywords: [],
          canonicalUrl: "",
        },
      };
      setActiveLang(lang);
      setHasChanges(true);
      return {
        ...prev,
        translations: { ...prev.translations, [lang]: empty },
        slugs: { ...(prev.slugs ?? {}), [lang]: "" },
      };
    });
  }, []);

  const onChangeActiveLang = useCallback(
    (lang: string) => {
      if (hasChanges) {
        setNavigateTo("");
        setShowUnsavedAlert(true);
      } else {
        setActiveLang(lang);
      }
    },
    [hasChanges]
  );

  const handleNavigation = useCallback(
    (path: string) => {
      if (hasChanges) {
        setNavigateTo(path);
        setShowUnsavedAlert(true);
      } else {
        navigate(path);
      }
    },
    [hasChanges, navigate]
  );

  const onSettingsChange = useCallback(
    (
      field:
        | "status"
        | "publishAt"
        | "expireAt"
        | "tags"
        | "defaultCurrency"
        | "thumbnail"
        | "gallery"
        | "collectionIds",
      value: string | string[] | null
    ) => {
      setLocalData((prev) => {
        if (!prev) return prev;
        if (field === "tags" || field === "gallery" || field === "collectionIds") {
          return { ...prev, [field]: (value ?? []) as string[] };
        }
        return { ...prev, [field]: value as string | null };
      });
      setHasChanges(true);
    },
    []
  );

  const addVariant = useCallback(() => {
    setLocalData((prev) => {
      if (!prev) return prev;

      const defaultPrice: ProductVariantPriceFormModel = {
        _tempId: createTempId(),
        currencyCode: prev.defaultCurrency ?? "",
        amount: 0,
      };

      const nextVariant: ProductVariantFormModel = {
        _tempId: createTempId(),
        title: "",
        sku: "",
        prices: [defaultPrice],
        inventoryQuantity: 0,
        allowBackorder: false,
      };

      return {
        ...prev,
        variants: [...(prev.variants ?? []), nextVariant],
      };
    });
    setHasChanges(true);
  }, []);

  const updateVariant = useCallback(
    (
      variantKey: string,
      field: keyof Omit<ProductVariantFormModel, "_tempId" | "prices">,
      value: string | number | boolean | undefined
    ) => {
      setLocalData((prev) => {
        if (!prev) return prev;

        const updated = (prev.variants ?? []).map((variant) => {
          const key = variant.id ?? variant._tempId;
          if (key !== variantKey) return variant;

          if (field === "inventoryQuantity") {
            const numericValue =
              value === "" || value === undefined || value === null
                ? undefined
                : Number(value);
            return {
              ...variant,
              inventoryQuantity: Number.isFinite(numericValue)
                ? (numericValue as number)
                : 0,
            };
          }

          if (field === "allowBackorder") {
            return {
              ...variant,
              allowBackorder: Boolean(value),
            };
          }

          if (field === "barcode") {
            const barcodeValue = typeof value === "string" ? value : "";
            return {
              ...variant,
              barcode: barcodeValue.trim() ? barcodeValue : undefined,
            };
          }

          return {
            ...variant,
            [field]: value as string,
          };
        });

        return {
          ...prev,
          variants: updated,
        };
      });
      setHasChanges(true);
    },
    []
  );

  const removeVariant = useCallback((variantKey: string) => {
    setLocalData((prev) => {
      if (!prev) return prev;
      const variants = prev.variants ?? [];
      return {
        ...prev,
        variants: variants.filter(
          (variant) => (variant.id ?? variant._tempId) !== variantKey
        ),
      };
    });
    setHasChanges(true);
  }, []);

  const addVariantPrice = useCallback(
    (variantKey: string) => {
      setLocalData((prev) => {
        if (!prev) return prev;

        const variants = prev.variants ?? [];
        const updated = variants.map((variant) => {
          const key = variant.id ?? variant._tempId;
          if (key !== variantKey) return variant;

          const prices = variant.prices ?? [];
          const nextPrice: ProductVariantPriceFormModel = {
            _tempId: createTempId(),
            currencyCode: prev.defaultCurrency ?? "",
            amount: 0,
          };

          return {
            ...variant,
            prices: [...prices, nextPrice],
          };
        });

        return {
          ...prev,
          variants: updated,
        };
      });
      setHasChanges(true);
    },
    []
  );

  const updateVariantPrice = useCallback(
    (
      variantKey: string,
      priceKey: string,
      field: keyof ProductVariantPriceFormModel,
      value: string | number | undefined
    ) => {
      if (field === "_tempId") return;

      setLocalData((prev) => {
        if (!prev) return prev;

        const variants = prev.variants ?? [];
        const updated = variants.map((variant) => {
          const key = variant.id ?? variant._tempId;
          if (key !== variantKey) return variant;

          const prices = variant.prices ?? [];
          const updatedPrices = prices.map((price) => {
            if (price._tempId !== priceKey) return price;

            if (field === "amount" || field === "compareAtAmount") {
              const numericValue =
                value === "" || value === undefined || value === null
                  ? undefined
                  : Number(value);

              if (field === "amount") {
                if (numericValue === undefined) {
                  return {
                    ...price,
                    amount: Number.NaN,
                  };
                }

                return {
                  ...price,
                  amount: Number.isFinite(numericValue)
                    ? (numericValue as number)
                    : Number.NaN,
                };
              }

              return {
                ...price,
                compareAtAmount: Number.isFinite(numericValue)
                  ? (numericValue as number)
                  : undefined,
              };
            }

            if (field === "currencyCode") {
              const code = typeof value === "string" ? value.toUpperCase() : "";
              return {
                ...price,
                currencyCode: code,
              };
            }

            return price;
          });

          return {
            ...variant,
            prices: updatedPrices,
          };
        });

        return {
          ...prev,
          variants: updated,
        };
      });
      setHasChanges(true);
    },
    []
  );

  const removeVariantPrice = useCallback((variantKey: string, priceKey: string) => {
    setLocalData((prev) => {
      if (!prev) return prev;

      const variants = prev.variants ?? [];
      const updated = variants.map((variant) => {
        const key = variant.id ?? variant._tempId;
        if (key !== variantKey) return variant;

        const prices = variant.prices ?? [];
        return {
          ...variant,
          prices: prices.filter((price) => price._tempId !== priceKey),
        };
      });

      return {
        ...prev,
        variants: updated,
      };
    });
    setHasChanges(true);
  }, []);

  const generateSlug = useCallback((title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }, []);

  const onChange = useCallback(
    (
      field: keyof ProductTranslationModel,
      value: string | number | boolean | string[]
    ) => {
      setLocalData((prev) => {
        if (!prev) return prev;
        const current = prev.translations?.[activeLang] ?? {
          title: "",
          subtitle: "",
          summary: "",
          description: "",
          slug: "",
          seo: {
            metaTitle: "",
            metaDescription: "",
            metaKeywords: [],
            canonicalUrl: "",
          },
        };

        const updatedTranslations = {
          ...prev.translations,
          [activeLang]: { ...current },
        };

        const updatedSlugs = { ...(prev.slugs ?? {}) };

        if (field === "title") {
          const newTitle = value as string;
          const slug = generateSlug(newTitle);
          updatedTranslations[activeLang] = {
            ...updatedTranslations[activeLang],
            title: newTitle,
            slug,
          };
          updatedSlugs[activeLang] = slug;
        } else if (field === "slug") {
          const slugValue = String(value);
          updatedTranslations[activeLang] = {
            ...updatedTranslations[activeLang],
            slug: slugValue,
          };
          updatedSlugs[activeLang] = slugValue;
        } else {
          updatedTranslations[activeLang] = {
            ...updatedTranslations[activeLang],
            [field]: value,
          };
        }

        return {
          ...prev,
          translations: updatedTranslations,
          slugs: updatedSlugs,
        };
      });

      setHasChanges(true);
    },
    [activeLang, generateSlug]
  );

  const onSeoChange = useCallback(
    <K extends keyof ProductSeoModel>(
      lang: string,
      field: K,
      value: ProductSeoModel[K]
    ) => {
      setLocalData((prev) => {
        if (!prev) return prev;
        const current = prev.translations?.[lang] ?? {
          title: "",
          subtitle: "",
          summary: "",
          description: "",
          slug: "",
        };
        return {
          ...prev,
          translations: {
            ...prev.translations,
            [lang]: {
              ...current,
              seo: {
                metaTitle: current.seo?.metaTitle ?? "",
                metaDescription: current.seo?.metaDescription ?? "",
                metaKeywords: current.seo?.metaKeywords ?? [],
                canonicalUrl: current.seo?.canonicalUrl ?? "",
                [field]: value,
              },
            },
          },
        };
      });
      setHasChanges(true);
    },
    []
  );

  const validateForm = useCallback(() => {
    if (!localData) return false;
    const errors: ProductFormErrors = {};
    const translation = localData.translations?.[activeLang];

    if (!translation?.title?.trim()) {
      errors.title = t("products.errors.titleRequired", "Title is required");
    }

    if (!translation?.slug?.trim()) {
      errors.slug = t("products.errors.slugRequired", "Slug is required");
    }

    const variants = localData.variants ?? [];
    if (variants.length > 0) {
      for (const variant of variants) {
        if (!variant.title?.trim()) {
          errors.variants = t(
            "products.errors.variantTitleRequired",
            "Each variant must have a title."
          );
          break;
        }

        if (!variant.sku?.trim()) {
          errors.variants = t(
            "products.errors.variantSkuRequired",
            "Each variant must have an SKU."
          );
          break;
        }

        if (
          variant.inventoryQuantity !== undefined &&
          variant.inventoryQuantity !== null &&
          variant.inventoryQuantity < 0
        ) {
          errors.variants = t(
            "products.errors.variantInventoryInvalid",
            "Inventory quantity cannot be negative."
          );
          break;
        }

        const prices = variant.prices ?? [];
        if (!prices.length) {
          errors.variants = t(
            "products.errors.variantPriceRequired",
            "Each variant must include at least one price."
          );
          break;
        }

        for (const price of prices) {
          if (!price.currencyCode?.trim()) {
            errors.variants = t(
              "products.errors.variantCurrencyRequired",
              "Price entries require a currency."
            );
            break;
          }

          if (
            price.amount === undefined ||
            price.amount === null ||
            Number.isNaN(price.amount)
          ) {
            errors.variants = t(
              "products.errors.variantAmountRequired",
              "Price entries require an amount."
            );
            break;
          }
        }

        if (errors.variants) {
          break;
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [activeLang, localData, t]);

  const handleSave = useCallback(async () => {
    if (!localData || !validateForm()) {
      toast.error(t("products.errors.formInvalid", "Invalid form"), {
        description: t(
          "products.errors.formInvalidDescription",
          "Check the required fields and try again."
        ),
      });
      return;
    }

    const translation = localData.translations?.[activeLang];
    if (!translation) {
      toast.error(
        t("products.errors.missingTranslation", "Missing translation"),
        {
          description: t("products.errors.translationMissingDescription", {
            defaultValue: "The selected language is not configured.",
            language: activeLang,
          }),
        }
      );
      return;
    }

    const toastId = toast.loading(
      t("products.details.notifications.saving", "Saving product...")
    );

    try {
      const payload = {
        slug: translation.slug ?? "",
        language: activeLang,
        status: (localData.status as string) ?? ProductStatus.Draft,
        title: translation.title,
        subtitle: translation.subtitle ?? undefined,
        summary: translation.summary ?? undefined,
        description: translation.description ?? undefined,
        seo: translation.seo,
        tags: localData.tags ?? [],
        publishAt: localData.publishAt ?? undefined,
        expireAt: localData.expireAt ?? undefined,
        defaultCurrency: localData.defaultCurrency ?? undefined,
        thumbnail: localData.thumbnail ?? undefined,
        gallery: localData.gallery ?? [],
        collectionIds: (localData.collectionIds ?? []).filter((value) =>
          Boolean(value)
        ),
        variants: (localData.variants ?? []).map((variant) => {
          const { _tempId, prices, barcode, inventoryQuantity, ...rest } = variant;
          const sanitizedPrices = (prices ?? [])
            .filter((price) => price.currencyCode?.trim())
            .map(({ _tempId: priceTempId, amount, compareAtAmount, ...price }) => ({
              ...price,
              amount: Number.isFinite(amount) ? amount : 0,
              ...(compareAtAmount === undefined || compareAtAmount === null
                ? {}
                : {
                    compareAtAmount: Number.isFinite(compareAtAmount)
                      ? compareAtAmount
                      : undefined,
                  }),
            }));

          return {
            ...rest,
            ...(barcode?.trim() ? { barcode: barcode.trim() } : {}),
            inventoryQuantity:
              inventoryQuantity === undefined || inventoryQuantity === null
                ? 0
                : inventoryQuantity,
            allowBackorder: Boolean(variant.allowBackorder),
            prices: sanitizedPrices,
          };
        }),
      };

      const endpoint = isCreating
        ? "commerce/products"
        : `commerce/products/${localData.id}`;
      const method = isCreating ? "POST" : "PATCH";

      const result = await fetchData(endpoint, method, payload);

      if (result?.data) {
        const normalized = normalizeProduct(result.data);
        setLocalData(normalized);
        setHasChanges(false);
        setFormErrors({});

        toast.success(
          t(
            `products.details.notifications.${
              isCreating ? "created" : "saved"
            }`
          ),
          {
            id: toastId,
            description: t("products.details.notifications.title", {
              title: translation.title,
            }),
          }
        );

        if (isCreating && normalized.id) {
          navigate(`/commerce/products/${normalized.id}`);
        }
      } else {
        toast.error(t("products.errors.saveFailed"), {
          id: toastId,
          description: t(
            "products.errors.saveFailedDescription",
            "No response received from the server."
          ),
        });
      }
    } catch (error) {
      console.error("Failed to save product", error);
      toast.error(t("products.errors.saveFailed"), {
        id: toastId,
        description: t(
          "products.errors.saveFailedDescription",
          "Unable to save the product. Please try again."
        ),
      });
      setFormErrors({
        apiError: t(
          "products.errors.saveFailedDescription",
          "Unable to save the product. Please try again."
        ),
      });
    }
  }, [
    activeLang,
    fetchData,
    isCreating,
    localData,
    navigate,
    t,
    validateForm,
  ]);

  return {
    data: localData,
    loading,
    activeLang,
    setActiveLang: onChangeActiveLang,
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
  };
}
