import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { VariantFieldErrors } from "../components/variants-section";
import type { ProductDetailsState } from "./product-details.types";
import { slugifyOptionHandle } from "./product-details.utils";

export function useProductOptions({
  localData,
  setLocalData,
  setHasChanges,
  setVariantErrors,
}: {
  localData: ProductDetailsState | null;
  setLocalData: React.Dispatch<
    React.SetStateAction<ProductDetailsState | null>
  >;
  setHasChanges: (value: boolean) => void;
  setVariantErrors: React.Dispatch<
    React.SetStateAction<VariantFieldErrors[]>
  >;
}) {
  const { t } = useTranslation<"commerce">("commerce");

  const onAddOption = useCallback(() => {
    setLocalData((prev) => {
      if (!prev) return prev;

      const existingOptions = prev.options ?? [];
      const position = existingOptions.length;
      const defaultLabel = t("products.details.options.defaultName", {
        index: position + 1,
      });
      const baseHandle = slugifyOptionHandle(defaultLabel) || `option-${position + 1}`;

      let handle = baseHandle;
      let attempt = 1;
      const existingHandles = new Set(existingOptions.map((option) => option.name));
      while (existingHandles.has(handle)) {
        handle = `${baseHandle}-${++attempt}`;
      }

      const option: ProductDetailsState["options"][number] = {
        name: handle,
        displayName: defaultLabel,
        values: [],
        position,
      };

      return {
        ...prev,
        options: [...existingOptions, option],
      };
    });
    setHasChanges(true);
  }, [setHasChanges, setLocalData, t]);

  const onRemoveOption = useCallback(
    (index: number) => {
      const clearedIndexes = new Set<number>();
      const missingOptionIndexes = new Set<number>();
      const missingValueIndexes = new Set<number>();

      setLocalData((prev) => {
        if (!prev) return prev;
        const options = [...(prev.options ?? [])];
        const target = options[index];
        if (!target) return prev;

        options.splice(index, 1);

        const normalizedOptions = options.map((option, optionIndex) => ({
          ...option,
          position: optionIndex,
        }));

        const fallbackOption = normalizedOptions[0];

        const variants = (prev.variants ?? []).map((variant, variantIndex) => {
          if (variant.optionName === target.name) {
            if (fallbackOption?.name) {
              const hasExistingValue = fallbackOption.values?.includes(
                variant.optionValue ?? ""
              );
              const fallbackValue = hasExistingValue
                ? variant.optionValue
                : fallbackOption.values?.[0];

              if (fallbackValue) {
                clearedIndexes.add(variantIndex);
              } else {
                missingValueIndexes.add(variantIndex);
              }

              return {
                ...variant,
                optionName: fallbackOption.name,
                optionValue: fallbackValue,
              };
            }

            missingOptionIndexes.add(variantIndex);
            missingValueIndexes.add(variantIndex);
            return {
              ...variant,
              optionName: undefined,
              optionValue: undefined,
            };
          }

          return variant;
        });

        return {
          ...prev,
          options: normalizedOptions,
          variants,
        };
      });

      if (
        clearedIndexes.size ||
        missingOptionIndexes.size ||
        missingValueIndexes.size
      ) {
        setVariantErrors((prev) => {
          const next = [...prev];
          clearedIndexes.forEach((idx) => {
            while (next.length <= idx) {
              next.push({});
            }
            const current = next[idx];
            if (!current) return;
            const updated = { ...current } as VariantFieldErrors;
            delete updated.optionName;
            delete updated.optionValue;
            next[idx] = Object.keys(updated).length ? updated : {};
          });

          missingOptionIndexes.forEach((idx) => {
            while (next.length <= idx) {
              next.push({});
            }
            const current = next[idx] ?? {};
            next[idx] = {
              ...current,
              optionName: t(
                "products.errors.variantOptionRequired",
                "Select an option"
              ),
              optionValue: t(
                "products.errors.variantOptionValueRequired",
                "Select a value"
              ),
            };
          });

          missingValueIndexes.forEach((idx) => {
            while (next.length <= idx) {
              next.push({});
            }
            if (missingOptionIndexes.has(idx)) return;
            const current = next[idx] ?? {};
            next[idx] = {
              ...current,
              optionValue: t(
                "products.errors.variantOptionValueRequired",
                "Select a value"
              ),
            };
          });

          return next;
        });
      }

      setHasChanges(true);
    },
    [setHasChanges, setLocalData, setVariantErrors, t]
  );

  const onOptionChange = useCallback(
    (
      index: number,
      field: "name" | "displayName",
      value: string
    ) => {
      setLocalData((prev) => {
        if (!prev) return prev;
        const options = [...(prev.options ?? [])];
        const target = options[index];
        if (!target) return prev;

        const updatedOption = { ...target } as ProductDetailsState["options"][number];
        if (field === "displayName") {
          updatedOption.displayName = value;
          const currentSlug = slugifyOptionHandle(target.displayName ?? "");
          const currentHandle = target.name ?? "";
          const nextSlug = slugifyOptionHandle(value);

          if (!currentHandle || currentHandle === currentSlug) {
            updatedOption.name = nextSlug || currentHandle;
          }
        } else {
          const nextHandle = slugifyOptionHandle(value);
          updatedOption.name = nextHandle;

          const variants = (prev.variants ?? []).map((variant) => {
            if (variant.optionName === target.name) {
              return {
                ...variant,
                optionName: nextHandle,
              };
            }
            return variant;
          });

          options[index] = {
            ...updatedOption,
            position: target.position,
          };

          return {
            ...prev,
            options,
            variants,
          };
        }

        options[index] = {
          ...updatedOption,
          position: target.position,
        };

        return {
          ...prev,
          options,
        };
      });

      setHasChanges(true);
    },
    [setHasChanges, setLocalData]
  );

  const onOptionValueAdd = useCallback(
    (index: number, value: string) => {
      setLocalData((prev) => {
        if (!prev) return prev;
        const options = [...(prev.options ?? [])];
        const target = options[index];
        if (!target) return prev;

        const trimmedValue = value.trim();
        if (!trimmedValue) return prev;

        const existingValues = new Set(target.values ?? []);
        if (existingValues.has(trimmedValue)) {
          return prev;
        }

        const nextValues = [...(target.values ?? []), trimmedValue];

        options[index] = {
          ...target,
          values: nextValues,
        };

        return {
          ...prev,
          options,
        };
      });

      setHasChanges(true);
    },
    [setHasChanges, setLocalData]
  );

  const onOptionValueRemove = useCallback(
    (index: number, value: string) => {
      const missingValueIndexes = new Set<number>();

      setLocalData((prev) => {
        if (!prev) return prev;
        const options = [...(prev.options ?? [])];
        const target = options[index];
        if (!target) return prev;

        const filteredValues = (target.values ?? []).filter(
          (entry) => entry !== value
        );

        options[index] = {
          ...target,
          values: filteredValues,
        };

        const variants = (prev.variants ?? []).map((variant, variantIndex) => {
          if (variant.optionName === target.name && variant.optionValue === value) {
            const fallbackValue = filteredValues[0];
            if (fallbackValue) {
              return {
                ...variant,
                optionValue: fallbackValue,
              };
            }
            missingValueIndexes.add(variantIndex);
            return {
              ...variant,
              optionValue: undefined,
            };
          }
          return variant;
        });

        return {
          ...prev,
          options,
          variants,
        };
      });

      if (missingValueIndexes.size) {
        setVariantErrors((prev) => {
          const next = [...prev];
          missingValueIndexes.forEach((idx) => {
            while (next.length <= idx) {
              next.push({});
            }
            const current = next[idx] ?? {};
            next[idx] = {
              ...current,
              optionValue: t(
                "products.errors.variantOptionValueRequired",
                "Select a value"
              ),
            };
          });

          return next;
        });
      }

      setHasChanges(true);
    },
    [setHasChanges, setLocalData, setVariantErrors, t]
  );

  return {
    productOptions: localData?.options ?? [],
    onAddOption,
    onRemoveOption,
    onOptionChange,
    onOptionValueAdd,
    onOptionValueRemove,
  };
}
