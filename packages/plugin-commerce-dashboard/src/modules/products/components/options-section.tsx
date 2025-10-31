import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
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
} from "@kitejs-cms/dashboard-core";
import type { ProductOptionModel } from "@kitejs-cms/plugin-commerce-api";

interface OptionsSectionProps {
  options: ProductOptionModel[];
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  onOptionChange: (index: number, field: "name" | "displayName", value: string) => void;
  onOptionValueAdd: (index: number, value: string) => void;
  onOptionValueRemove: (index: number, value: string) => void;
}

export function OptionsSection({
  options,
  onAddOption,
  onRemoveOption,
  onOptionChange,
  onOptionValueAdd,
  onOptionValueRemove,
}: OptionsSectionProps) {
  const { t } = useTranslation("commerce");
  const [valueInputs, setValueInputs] = useState<Record<string, string>>({});

  const emptyState = (
    <div className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
      {t("products.details.options.empty")}
    </div>
  );

  return (
    <Card className="w-full gap-0 py-0 shadow-neutral-50">
      <CardHeader className="rounded-t-xl bg-secondary py-6 text-primary">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t("products.details.options.title")}</CardTitle>
            <p className="text-sm text-primary/70">
              {t("products.details.options.description")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={onAddOption}
          >
            <Plus className="h-4 w-4" />
            {t("products.details.options.add")}
          </Button>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-4 p-4 md:p-6">
        {options.length === 0 && emptyState}
        {options.length > 0 && (
          <div className="space-y-4">
            {options.map((option, index) => {
              const optionKey = option.name || `option-${index}`;
              const valueInput = valueInputs[optionKey] ?? "";
              const valueCount = option.values?.length ?? 0;

              const handleRemove = () => {
                onRemoveOption(index);
                setValueInputs((prev) => {
                  const next = { ...prev };
                  delete next[optionKey];
                  return next;
                });
              };

              const handleValueAdd = () => {
                const trimmed = valueInput.trim();
                if (!trimmed) return;
                onOptionValueAdd(index, trimmed);
                setValueInputs((prev) => ({ ...prev, [optionKey]: "" }));
              };

              return (
                <div
                  key={optionKey}
                  className="space-y-4 rounded-lg border border-border bg-background p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {option.displayName ?? option.name ?? t("products.details.options.untitled")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("products.details.options.optionSummary", { count: valueCount })}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={handleRemove}
                      aria-label={t("products.details.options.remove")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t("products.details.options.fields.displayName")}</Label>
                      <Input
                        value={option.displayName ?? ""}
                        onChange={(event) =>
                          onOptionChange(index, "displayName", event.target.value)
                        }
                        placeholder={t(
                          "products.details.options.fields.displayNamePlaceholder"
                        )}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("products.details.options.fields.displayNameHint")}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("products.details.options.fields.handle")}</Label>
                      <Input
                        value={option.name ?? ""}
                        onChange={(event) =>
                          onOptionChange(index, "name", event.target.value)
                        }
                        placeholder={t(
                          "products.details.options.fields.handlePlaceholder"
                        )}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("products.details.options.fields.handleHint")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>{t("products.details.options.fields.values")}</Label>
                      {valueCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {t("products.details.options.fields.valuesCount", {
                            count: valueCount,
                          })}
                        </span>
                      )}
                    </div>
                    {valueCount > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {option.values?.map((value) => (
                          <div
                            key={value}
                            className="flex items-center gap-1 rounded-full border border-muted-foreground/40 bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                          >
                            <span>{value}</span>
                            <button
                              type="button"
                              className="text-muted-foreground transition hover:text-destructive"
                              onClick={() => onOptionValueRemove(index, value)}
                              aria-label={t("products.details.options.removeValue")}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {t("products.details.options.fields.valuesEmpty")}
                      </p>
                    )}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        value={valueInput}
                        onChange={(event) =>
                          setValueInputs((prev) => ({
                            ...prev,
                            [optionKey]: event.target.value,
                          }))
                        }
                        placeholder={t(
                          "products.details.options.fields.newValuePlaceholder"
                        )}
                        className="sm:w-48"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={handleValueAdd}
                        disabled={!valueInput.trim()}
                      >
                        <Plus className="h-4 w-4" />
                        {t("products.details.options.fields.addValue")}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
