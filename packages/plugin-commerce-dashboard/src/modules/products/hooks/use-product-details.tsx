import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  useApi,
  useBreadcrumb,
  useSettingsContext,
} from "@kitejs-cms/dashboard-core";
import type {
  ProductOptionModel,
  ProductResponseDetailsModel,
  ProductSeoModel,
  ProductTranslationModel,
  ProductUpsertModel,
  ProductVariant,
  ProductPriceModel,
} from "@kitejs-cms/plugin-commerce-api";
import { ProductStatus } from "@kitejs-cms/plugin-commerce-api";

type VariantWithOptionalId = ProductVariant & { id?: string };

const createEmptyTranslation = (): ProductTranslationModel => ({
  title: "",
  subtitle: "",
  summary: "",
  description: "",
  slug: "",
  seo: {},
});

const createEmptyVariant = (): VariantWithOptionalId => ({
  id: undefined,
  title: "",
  sku: "",
  barcode: "",
  prices: [],
  inventoryQuantity: 0,
  allowBackorder: false,
  gallery: [],
  optionName: "",
  optionValue: "",
  downloadUrl: undefined,
});

export interface FormErrors {
  title?: string;
  slug?: string;
  apiError?: string;
  [key: string]: string | undefined;
}

export function useProductDetails() {
  const navigate = useNavigate();
  const { t } = useTranslation("commerce");
  const { setBreadcrumb } = useBreadcrumb();
  const { cmsSettings } = useSettingsContext();

  const defaultLang = useMemo(
    () => cmsSettings?.defaultLanguage || "en",
    [cmsSettings]
  );

  const { loading, fetchData } = useApi<ProductResponseDetailsModel>();
  const { id } = useParams<{ id: string }>();

  const [activeLang, setActiveLang] = useState(defaultLang);
  const [hasChanges, setHasChanges] = useState(false);
  const [navigateTo, setNavigateTo] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);

  const [localData, setLocalData] =
    useState<ProductResponseDetailsModel | null>(null);

  useEffect(() => {
    const items = [
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.products"), path: "/commerce/products" },
    ];

    if (id && localData && localData?.translations[activeLang]?.slug)
      items.push({
        label: localData.translations[activeLang].slug,
        path: `/commerce/products/${localData.id}`,
      });

    setBreadcrumb(items);
  }, [activeLang, id, localData, setBreadcrumb, t]);

  useEffect(() => {
    if (!defaultLang) return;

    if (id === "create") {
      const newProduct: ProductResponseDetailsModel = {
        id: "",
        status: ProductStatus.Draft,
        type: "",
        isDigital: false,
        defaultCurrency: "",
        variants: [],
        options: [],
        gallery: [],
        tags: [],
        collections: [],
        publishAt: undefined,
        expireAt: undefined,
        thumbnail: undefined,
        createdBy: null,
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        translations: {
          [defaultLang]: createEmptyTranslation(),
        },
      };

      setLocalData(newProduct);
      setActiveLang(defaultLang);
      return;
    }

    if (id) {
      (async () => {
        const result = await fetchData(`commerce/products/${id}`);
        if (result?.data) {
          setLocalData(result.data);
          setHasChanges(false);
        }
      })();
    }
  }, [id, fetchData, defaultLang]);

  useEffect(() => {
    if (!localData) return;
    const langs = Object.keys(localData.translations);
    const sorted = [...langs].sort((a, b) =>
      a === defaultLang ? -1 : b === defaultLang ? 1 : a.localeCompare(b)
    );
    if (!langs.includes(activeLang)) {
      setActiveLang(sorted[0]);
    }
  }, [localData, defaultLang, activeLang]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent): string | void => {
      if (hasChanges) {
        e.preventDefault();
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
    navigate(navigateTo);
  }, [navigate, navigateTo]);

  const onAddLanguage = useCallback((lang: string) => {
    setLocalData((prev) => {
      if (!prev) return prev;
      if (prev.translations[lang]) {
        setActiveLang(lang);
        return prev;
      }
      const empty: ProductTranslationModel = {
        title: "",
        description: "",
        slug: "",
      };
      setActiveLang(lang);
      setHasChanges(true);
      return {
        ...prev,
        translations: { ...prev.translations, [lang]: empty },
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
        | "collections",
      value: string | string[] | Date | null | undefined
    ) => {
      let updated = false;
      setLocalData((prev) => {
        if (!prev) return prev;
        updated = true;
        if (field === "tags") {
          return { ...prev, tags: Array.isArray(value) ? value : [] };
        }

        if (field === "collections") {
          return {
            ...prev,
            collections: Array.isArray(value)
              ? (value as string[])
              : prev.collections,
          };
        }

        if (field === "publishAt" || field === "expireAt") {
          const parsedValue =
            value instanceof Date
              ? value
              : typeof value === "string" && value
                ? new Date(value)
                : undefined;
          return {
            ...prev,
            [field]: parsedValue,
          };
        }

        return {
          ...prev,
          [field]: value as ProductResponseDetailsModel[typeof field],
        };
      });

      if (updated) {
        setHasChanges(true);
      }
    },
    []
  );

  const onFieldChange = useCallback(
    <K extends keyof ProductResponseDetailsModel>(
      field: K,
      value: ProductResponseDetailsModel[K]
    ) => {
      if (field === "translations") return;
      let updated = false;
      setLocalData((prev) => {
        if (!prev) return prev;
        updated = true;
        return {
          ...prev,
          [field]: value,
        };
      });

      if (updated) {
        setHasChanges(true);
      }
    },
    []
  );

  const onTranslationChange = useCallback(
    (
      field: keyof ProductTranslationModel,
      value: string | number | boolean | string[] | ProductSeoModel | null
    ) => {
      let updated = false;
      setLocalData((prev) => {
        if (!prev) return prev;

        const updatedTranslations = { ...prev.translations };
        const current =
          updatedTranslations[activeLang] ?? createEmptyTranslation();

        // Auto-generate slug if the title is updated
        if (field === "title") {
          const slug = generateSlug(value as string);
          updatedTranslations[activeLang] = {
            ...current,
            title: value as string,
            slug,
          };
        } else if (field in current) {
          updatedTranslations[activeLang] = {
            ...current,
            [field]: value ?? "",
          };
        } else {
          return prev;
        }

        updated = true;

        return {
          ...prev,
          translations: updatedTranslations,
        };
      });

      if (updated) {
        setHasChanges(true);
      }
    },
    [activeLang]
  );

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, "-");
  };

  const validateForm = useCallback((): boolean => {
    if (!localData) return false;

    const errors: FormErrors = {};
    const translation = localData.translations[activeLang];

    if (!translation?.title?.trim()) {
      errors.title = t(
        "products.errors.titleRequired",
        "Title is required"
      );
    }

    if (!translation?.slug?.trim()) {
      errors.slug = t("products.errors.slugRequired", "Slug is required");
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [localData, activeLang, t]);

  const handleSave = useCallback(async () => {
    if (!localData || !validateForm()) {
      toast.error("Form non valido", {
        description: "Controlla i campi obbligatori",
      });
      return;
    }

    const toastId = toast.loading("Salvataggio in corso...");

    try {
      const translation = localData.translations[activeLang];
      if (!translation) {
        toast.error("Traduzione mancante", {
          description: `Lingua ${activeLang} non configurata`,
        });
        return;
      }

      const formatDate = (date?: Date) =>
        date ? new Date(date).toISOString() : undefined;

      const body: ProductUpsertModel = {
        id: id && id !== "create" ? localData.id : undefined,
        language: activeLang,
        status: localData.status,
        slug: translation.slug,
        title: translation.title,
        subtitle: translation.subtitle,
        summary: translation.summary,
        description: translation.description,
        tags: localData.tags,
        seo: translation.seo,
        publishAt: formatDate(localData.publishAt),
        expireAt: formatDate(localData.expireAt),
        thumbnail: localData.thumbnail,
        gallery: localData.gallery,
        collectionIds: localData.collections,
        variants: localData.variants?.map((variant) => ({
          id: variant.id,
          title: variant.title,
          sku: variant.sku,
          barcode: variant.barcode,
          prices: variant.prices,
          inventoryQuantity: variant.inventoryQuantity,
          allowBackorder: variant.allowBackorder,
        })),
        defaultCurrency: localData.defaultCurrency,
      };

      const result = await fetchData("commerce/products", "POST", body);

      if (result?.data) {
        toast.success(
          t(
            `products.details.notifications.${
              id === "create" ? "created" : "saved"
            }`,
            id === "create"
              ? "Product created successfully"
              : "Product saved successfully"
          ),
          {
            id: toastId,
            description: t("products.details.notifications.title", {
              title: translation.title,
            }),
          }
        );

        setLocalData(result.data);
        setHasChanges(false);
        setFormErrors({});

        if (id === "create") {
          navigate(`/commerce/products/${result.data.id}`);
        }
      } else {
        toast.error("Errore nel salvataggio", {
          id: toastId,
          description: "Nessun dato ricevuto dal server",
        });
      }
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Errore nel salvataggio", {
        id: toastId,
        description: t(
          "products.errors.saveFailed",
          "Failed to save product. Please try again."
        ),
      });
      setFormErrors({
        apiError: t(
          "products.errors.saveFailed",
          "Failed to save product. Please try again."
        ),
      });
    }
  }, [localData, activeLang, id, fetchData, navigate, t, validateForm]);

  const onSeoChange = useCallback(
    <K extends keyof ProductSeoModel>(
      lang: string,
      field: K,
      value: ProductSeoModel[K]
    ) => {
      setLocalData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          translations: {
            ...prev.translations,
            [lang]: {
              ...prev.translations[lang],
              seo: {
                ...prev.translations[lang].seo,
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

  const onGalleryChange = useCallback((gallery: string[]) => {
    let updated = false;
    setLocalData((prev) => {
      if (!prev) return prev;
      updated = true;
      return {
        ...prev,
        gallery,
      };
    });

    if (updated) {
      setHasChanges(true);
    }
  }, []);

  const onThumbnailChange = useCallback((thumbnail?: string) => {
    let updated = false;
    setLocalData((prev) => {
      if (!prev) return prev;
      updated = true;
      return {
        ...prev,
        thumbnail,
      };
    });

    if (updated) {
      setHasChanges(true);
    }
  }, []);

  const onOptionAdd = useCallback(() => {
    let updated = false;
    setLocalData((prev) => {
      if (!prev) return prev;
      updated = true;
      const position = prev.options.length;
      const newOption: ProductOptionModel = {
        name: "",
        values: [],
        position,
      };

      return {
        ...prev,
        options: [...prev.options, newOption],
      };
    });

    if (updated) {
      setHasChanges(true);
    }
  }, []);

  const onOptionUpdate = useCallback(
    (index: number, changes: Partial<ProductOptionModel>) => {
      let updated = false;
      setLocalData((prev) => {
        if (!prev) return prev;
        if (!prev.options[index]) return prev;
        updated = true;

        const options = prev.options.map((option, optionIndex) =>
          optionIndex === index ? { ...option, ...changes } : option
        );

        return {
          ...prev,
          options,
        };
      });

      if (updated) {
        setHasChanges(true);
      }
    },
    []
  );

  const onOptionsReorder = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    let updated = false;
    setLocalData((prev) => {
      if (!prev) return prev;
      if (!prev.options[fromIndex] || !prev.options[toIndex]) {
        return prev;
      }

      updated = true;

      const options = [...prev.options];
      const [moved] = options.splice(fromIndex, 1);
      options.splice(toIndex, 0, moved);

      return {
        ...prev,
        options: options.map((option, position) => ({
          ...option,
          position,
        })),
      };
    });

    if (updated) {
      setHasChanges(true);
    }
  }, []);

  const onOptionRemove = useCallback((index: number) => {
    let updated = false;
    setLocalData((prev) => {
      if (!prev) return prev;
      if (!prev.options[index]) return prev;
      updated = true;

      const remaining = prev.options
        .filter((_, optionIndex) => optionIndex !== index)
        .map((option, position) => ({ ...option, position }));

      return {
        ...prev,
        options: remaining,
      };
    });

    if (updated) {
      setHasChanges(true);
    }
  }, []);

  const onOptionValueAdd = useCallback((index: number, value: string) => {
    let updated = false;
    setLocalData((prev) => {
      if (!prev) return prev;
      const option = prev.options[index];
      if (!option) return prev;
      updated = true;

      const nextOption: ProductOptionModel = {
        ...option,
        values: [...option.values, value],
      };

      const options = prev.options.map((item, optionIndex) =>
        optionIndex === index ? nextOption : item
      );

      return {
        ...prev,
        options,
      };
    });

    if (updated) {
      setHasChanges(true);
    }
  }, []);

  const onOptionValueUpdate = useCallback(
    (optionIndex: number, valueIndex: number, value: string) => {
      let updated = false;
      setLocalData((prev) => {
        if (!prev) return prev;
        const option = prev.options[optionIndex];
        if (!option || !option.values[valueIndex]) return prev;
        updated = true;

        const values = option.values.map((current, index) =>
          index === valueIndex ? value : current
        );

        const options = prev.options.map((item, index) =>
          index === optionIndex ? { ...item, values } : item
        );

        return {
          ...prev,
          options,
        };
      });

      if (updated) {
        setHasChanges(true);
      }
    },
    []
  );

  const onOptionValueRemove = useCallback(
    (optionIndex: number, valueIndex: number) => {
      let updated = false;
      setLocalData((prev) => {
        if (!prev) return prev;
        const option = prev.options[optionIndex];
        if (!option || !option.values[valueIndex]) return prev;
        updated = true;

        const values = option.values.filter((_, index) => index !== valueIndex);

        const options = prev.options.map((item, index) =>
          index === optionIndex ? { ...item, values } : item
        );

        return {
          ...prev,
          options,
        };
      });

      if (updated) {
        setHasChanges(true);
      }
    },
    []
  );

  const onVariantAdd = useCallback(
    (variant?: Partial<VariantWithOptionalId>) => {
      let updated = false;
      setLocalData((prev) => {
        if (!prev) return prev;
        updated = true;

        const newVariant: VariantWithOptionalId = {
          ...createEmptyVariant(),
          ...variant,
        };

        return {
          ...prev,
          variants: [...prev.variants, newVariant],
        };
      });

      if (updated) {
        setHasChanges(true);
      }
    },
    []
  );

  const onVariantUpdate = useCallback(
    (index: number, changes: Partial<VariantWithOptionalId>) => {
      let updated = false;
      setLocalData((prev) => {
        if (!prev) return prev;
        if (!prev.variants[index]) return prev;
        updated = true;

        const variants = prev.variants.map((variant, variantIndex) =>
          variantIndex === index ? { ...variant, ...changes } : variant
        );

        return {
          ...prev,
          variants,
        };
      });

      if (updated) {
        setHasChanges(true);
      }
    },
    []
  );

  const onVariantRemove = useCallback((index: number) => {
    let updated = false;
    setLocalData((prev) => {
      if (!prev) return prev;
      if (!prev.variants[index]) return prev;
      updated = true;

      const variants = prev.variants.filter(
        (_, variantIndex) => variantIndex !== index
      );

      return {
        ...prev,
        variants,
      };
    });

    if (updated) {
      setHasChanges(true);
    }
  }, []);

  const onVariantPriceAdd = useCallback(
    (variantIndex: number, price?: ProductPriceModel) => {
      let updated = false;
      setLocalData((prev) => {
        if (!prev) return prev;
        const variant = prev.variants[variantIndex];
        if (!variant) return prev;
        updated = true;

        const prices = [...(variant.prices ?? []), price ?? { currencyCode: "", amount: 0 }];

        const variants = prev.variants.map((item, index) =>
          index === variantIndex ? { ...item, prices } : item
        );

        return {
          ...prev,
          variants,
        };
      });

      if (updated) {
        setHasChanges(true);
      }
    },
    []
  );

  const onVariantPriceUpdate = useCallback(
    (
      variantIndex: number,
      priceIndex: number,
      field: keyof ProductPriceModel,
      value: ProductPriceModel[keyof ProductPriceModel]
    ) => {
      let updated = false;
      setLocalData((prev) => {
        if (!prev) return prev;
        const variant = prev.variants[variantIndex];
        if (!variant) return prev;
        const prices = variant.prices ?? [];
        if (!prices[priceIndex]) return prev;
        updated = true;

        const nextPrices = prices.map((price, index) =>
          index === priceIndex ? { ...price, [field]: value } : price
        );

        const variants = prev.variants.map((item, index) =>
          index === variantIndex ? { ...item, prices: nextPrices } : item
        );

        return {
          ...prev,
          variants,
        };
      });

      if (updated) {
        setHasChanges(true);
      }
    },
    []
  );

  const onVariantPriceRemove = useCallback(
    (variantIndex: number, priceIndex: number) => {
      let updated = false;
      setLocalData((prev) => {
        if (!prev) return prev;
        const variant = prev.variants[variantIndex];
        if (!variant) return prev;
        const prices = variant.prices ?? [];
        if (!prices[priceIndex]) return prev;
        updated = true;

        const nextPrices = prices.filter((_, index) => index !== priceIndex);

        const variants = prev.variants.map((item, index) =>
          index === variantIndex ? { ...item, prices: nextPrices } : item
        );

        return {
          ...prev,
          variants,
        };
      });

      if (updated) {
        setHasChanges(true);
      }
    },
    []
  );

  const onVariantGalleryChange = useCallback(
    (variantIndex: number, gallery: string[]) => {
      let updated = false;
      setLocalData((prev) => {
        if (!prev) return prev;
        if (!prev.variants[variantIndex]) return prev;
        updated = true;

        const variants = prev.variants.map((variant, index) =>
          index === variantIndex ? { ...variant, gallery } : variant
        );

        return {
          ...prev,
          variants,
        };
      });

      if (updated) {
        setHasChanges(true);
      }
    },
    []
  );

  return {
    data: localData,
    loading,
    activeLang,
    setActiveLang: onChangeActiveLang,
    onAddLanguage,
    onSettingsChange,
    onFieldChange,
    confirmDiscard,
    hasChanges,
    handleNavigation,
    handleSave,
    onTranslationChange,
    onSeoChange,
    closeUnsavedAlert,
    showUnsavedAlert,
    formErrors,
    onGalleryChange,
    onThumbnailChange,
    onOptionAdd,
    onOptionUpdate,
    onOptionsReorder,
    onOptionRemove,
    onOptionValueAdd,
    onOptionValueUpdate,
    onOptionValueRemove,
    onVariantAdd,
    onVariantUpdate,
    onVariantRemove,
    onVariantPriceAdd,
    onVariantPriceUpdate,
    onVariantPriceRemove,
    onVariantGalleryChange,
  };
}
