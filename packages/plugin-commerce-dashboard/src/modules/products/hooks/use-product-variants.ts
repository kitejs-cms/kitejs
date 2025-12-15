import { useCallback, useMemo } from "react";
import type { ProductPriceModel } from "@kitejs-cms/plugin-commerce-api";
import type { VariantFieldErrors, VariantGalleryOption } from "../components/variants-section";
import { buildVariantGalleryOptions, slugifyOptionHandle } from "./product-details.utils";
import type { ProductDetailsState } from "./product-details.types";

export function useProductVariants({
  localData,
  setLocalData,
  setHasChanges,
  setVariantErrors,
  defaultCurrency,
  productOptions,
  activeLang,
  defaultLang,
}: {
  localData: ProductDetailsState | null;
  setLocalData: React.Dispatch<
    React.SetStateAction<ProductDetailsState | null>
  >;
  setHasChanges: (value: boolean) => void;
  setVariantErrors: React.Dispatch<
    React.SetStateAction<VariantFieldErrors[]>
  >;
  defaultCurrency: string;
  productOptions: ProductDetailsState["options"];
  activeLang: string;
  defaultLang?: string;
}) {
  const onVariantChange = useCallback(
    (
      index: number,
      field:
        | "title"
        | "sku"
        | "barcode"
        | "inventoryQuantity"
        | "allowBackorder"
        | "optionName"
        | "optionValue",
      value: string | number | boolean | undefined
    ) => {
      setLocalData((prev) => {
        if (!prev) return prev;
        const variants = [...(prev.variants ?? [])];
        const current = variants[index];
        if (!current) return prev;

        const updated = { ...current } as typeof current;

        switch (field) {
          case "title":
          case "sku":
          case "barcode":
            updated[field] = (value as string) ?? "";
            break;
          case "inventoryQuantity": {
            const numericValue =
              typeof value === "number"
                ? value
                : value === undefined
                  ? undefined
                  : Number(value);

            updated.inventoryQuantity =
              numericValue === undefined || Number.isNaN(numericValue)
                ? 0
                : Math.max(0, Math.trunc(numericValue));
            break;
          }
          case "allowBackorder":
            updated.allowBackorder = Boolean(value);
            break;
          case "optionName": {
            const rawValue = typeof value === "string" ? value : "";
            const normalizedValue = rawValue ? slugifyOptionHandle(rawValue) : "";
            const matchedOption = productOptions.find(
              (option) => option.name === rawValue || option.name === normalizedValue
            );

            if (matchedOption) {
              updated.optionName = matchedOption.name;
              if (
                matchedOption.values?.length &&
                matchedOption.values.includes(updated.optionValue ?? "")
              ) {
                updated.optionValue = updated.optionValue;
              } else {
                updated.optionValue = matchedOption.values?.[0];
              }
            } else {
              updated.optionName =
                normalizedValue && normalizedValue.length > 0
                  ? normalizedValue
                  : undefined;
            }
            break;
          }
          case "optionValue": {
            if (typeof value === "string") {
              const trimmed = value.trim();
              updated.optionValue = trimmed.length > 0 ? trimmed : undefined;
            } else {
              updated.optionValue = undefined;
            }
            break;
          }
        }

        variants[index] = updated;
        return { ...prev, variants };
      });
      setVariantErrors((prev) => {
        if (!prev.length) return prev;
        const current = prev[index];
        if (!current) return prev;
        const fieldKey = field as keyof VariantFieldErrors;
        if (!current[fieldKey]) {
          return prev;
        }

        const next = [...prev];
        const updatedErrors = { ...current } as VariantFieldErrors;
        delete updatedErrors[fieldKey];
        next[index] = Object.keys(updatedErrors).length ? updatedErrors : {};
        return next;
      });
      setHasChanges(true);
    },
    [productOptions, setHasChanges, setLocalData, setVariantErrors]
  );

  const onVariantPriceChange = useCallback(
    (index: number, field: keyof ProductPriceModel, value: string) => {
      setLocalData((prev) => {
        if (!prev) return prev;
        const variants = [...(prev.variants ?? [])];
        const current = variants[index];
        if (!current) return prev;

        const prices = [...(current.prices ?? [])];
        const primary = {
          currencyCode: defaultCurrency,
          amount: 0,
          compareAtAmount: undefined as number | undefined,
          ...prices[0],
        };

        if (field === "currencyCode") {
          primary.currencyCode = value
            ? value.trim().toUpperCase().slice(0, 3)
            : defaultCurrency;
        }

        if (field === "amount") {
          const parsed = Number.parseFloat(value);
          primary.amount = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
        }

        if (field === "compareAtAmount") {
          const parsed = Number.parseFloat(value);
          primary.compareAtAmount = Number.isNaN(parsed)
            ? undefined
            : Math.max(0, parsed);
        }

        prices[0] = primary;
        variants[index] = { ...current, prices };
        return { ...prev, variants };
      });
      setHasChanges(true);
    },
    [defaultCurrency, setHasChanges, setLocalData]
  );

  const onVariantGalleryChange = useCallback(
    (index: number, gallery: string[]) => {
      setLocalData((prev) => {
        if (!prev) return prev;
        const variants = [...(prev.variants ?? [])];
        const current = variants[index];
        if (!current) return prev;

        variants[index] = {
          ...current,
          gallery,
        };

        return { ...prev, variants };
      });

      setVariantErrors((prev) => {
        if (!prev.length) return prev;
        const current = prev[index];
        if (!current?.gallery) return prev;
        const next = [...prev];
        const updated = { ...current } as VariantFieldErrors;
        delete updated.gallery;
        next[index] = Object.keys(updated).length ? updated : {};
        return next;
      });

      setHasChanges(true);
    },
    [setHasChanges, setLocalData, setVariantErrors]
  );

  const onAddVariant = useCallback(() => {
    let didAdd = false;
    setLocalData((prev) => {
      if (!prev) return prev;

      const primaryOption = prev.options?.[0];
      const optionHandle = primaryOption?.name?.trim() || "default";
      const initialOptionValue =
        primaryOption?.values?.[0] ?? `${optionHandle}-${Date.now()}`;

      const variant: ProductDetailsState["variants"][number] = {
        id: undefined,
        title: "",
        sku: "",
        barcode: "",
        prices: [
          {
            currencyCode: defaultCurrency,
            amount: 0,
          },
        ],
        inventoryQuantity: 0,
        allowBackorder: false,
        gallery: [],
        optionName: optionHandle,
        optionValue: initialOptionValue,
      } as ProductDetailsState["variants"][number];

      didAdd = true;

      return {
        ...prev,
        variants: [...(prev.variants ?? []), variant],
      };
    });
    if (didAdd) {
      setVariantErrors((prev) => [...prev, {}]);
    }
    setHasChanges(true);
  }, [defaultCurrency, setHasChanges, setLocalData, setVariantErrors]);

  const onRemoveVariant = useCallback(
    (index: number) => {
      let didRemove = false;
      setLocalData((prev) => {
        if (!prev) return prev;
        const variants = [...(prev.variants ?? [])];
        if (!variants[index]) return prev;
        variants.splice(index, 1);
        didRemove = true;
        return { ...prev, variants };
      });
      if (didRemove) {
        setVariantErrors((prev) => {
          if (!prev.length) return prev;
          const next = [...prev];
          next.splice(index, 1);
          return next;
        });
      }
      setHasChanges(true);
    },
    [setHasChanges, setLocalData, setVariantErrors]
  );

  const variantGalleryOptions = useMemo<VariantGalleryOption[]>(() => {
    const languages = [activeLang, defaultLang].filter(
      (lang): lang is string => Boolean(lang)
    );

    return buildVariantGalleryOptions(localData, languages, localData?.gallery ?? []);
  }, [activeLang, defaultLang, localData]);

  return {
    variantGalleryOptions,
    onVariantChange,
    onVariantPriceChange,
    onVariantGalleryChange,
    onAddVariant,
    onRemoveVariant,
  };
}
