import { useState, useCallback, useMemo } from "react";
import {
  XIcon,
  PlusIcon,
  SaveIcon,
  BookmarkIcon,
  TrashIcon,
  FilterIcon,
  ArrowLeftIcon,
  AlertTriangleIcon,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { generateShortId } from "../lib/generate-id";
import type {
  FilterCondition,
  FilterFieldConfig,
  FilterFieldType,
  FilterOperator,
  FilterView,
} from "@kitejs-cms/core/index";
import { TagsInput } from "./tag-input";

export interface FilterConfig {
  fields: FilterFieldConfig[];
  views?: FilterView[];
  allowSaveViews?: boolean;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FilterConfig;
  initialConditions?: FilterCondition[];
  onApplyFilters: (conditions: FilterCondition[]) => void;
  onSaveView?: (view: FilterView) => void;
  onDeleteView?: (viewId: string) => void;
  onLoadView?: (view: FilterView) => void;
}

type ModalState = "filters" | "create-view" | "delete-view";

const DEFAULT_OPERATORS_BY_TYPE: Record<FilterFieldType, FilterOperator[]> = {
  string: ["equals", "ne", "contains", "startswith", "endswith", "exists"],
  number: ["equals", "ne", "gt", "gte", "lt", "lte", "exists"],
  date: ["equals", "ne", "gt", "gte", "lt", "lte", "exists"],
  boolean: ["equals", "ne"],
  select: ["equals", "ne", "in", "nin", "exists"],
  array: ["in", "nin", "exists"],
};

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: "Uguale a",
  ne: "Diverso da",
  gt: "Maggiore di",
  gte: "Maggiore o uguale",
  lt: "Minore di",
  lte: "Minore o uguale",
  in: "Include",
  nin: "Non include",
  contains: "Contiene",
  startswith: "Inizia con",
  endswith: "Finisce con",
  exists: "Esiste",
  regex: "Espressione regolare",
};

export function FilterModal({
  isOpen,
  onClose,
  config,
  initialConditions = [],
  onApplyFilters,
  onSaveView,
  onDeleteView,
  onLoadView,
}: FilterModalProps) {
  const [conditions, setConditions] =
    useState<FilterCondition[]>(initialConditions);
  const [modalState, setModalState] = useState<ModalState>("filters");
  const [viewName, setViewName] = useState("");
  const [viewDescription, setViewDescription] = useState("");
  const [selectedView, setSelectedView] = useState<string>("");
  const [viewToDelete, setViewToDelete] = useState<FilterView | null>(null);

  const addCondition = useCallback(() => {
    const newCondition: FilterCondition = {
      id: generateShortId(),
      field: config.fields[0]?.key || "",
      operator: "equals",
      value: "",
    };
    setConditions((prev) => [...prev, newCondition]);
  }, [config.fields]);

  const removeCondition = useCallback((conditionId: string) => {
    setConditions((prev) => prev.filter((c) => c.id !== conditionId));
  }, []);

  const updateCondition = useCallback(
    (conditionId: string, updates: Partial<FilterCondition>) => {
      setConditions((prev) =>
        prev.map((c) => (c.id === conditionId ? { ...c, ...updates } : c))
      );
    },
    []
  );

  const getFieldConfig = useCallback(
    (fieldKey: string) => {
      return config.fields.find((f) => f.key === fieldKey);
    },
    [config.fields]
  );

  const getAvailableOperators = useCallback(
    (fieldKey: string) => {
      const fieldConfig = getFieldConfig(fieldKey);
      if (!fieldConfig) return [];

      if (fieldConfig.operators?.length > 0) {
        return fieldConfig.operators;
      }

      return DEFAULT_OPERATORS_BY_TYPE[fieldConfig.type] || [];
    },
    [getFieldConfig]
  );

  const renderValueInput = useCallback(
    (condition: FilterCondition) => {
      const fieldConfig = getFieldConfig(condition.field);
      if (!fieldConfig) return null;

      if (condition.operator === "exists") {
        return (
          <Select
            value={condition.value?.toString() || "true"}
            onValueChange={(value) =>
              updateCondition(condition.id, { value: value === "true" })
            }
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Esiste</SelectItem>
              <SelectItem value="false">Non esiste</SelectItem>
            </SelectContent>
          </Select>
        );
      }

      switch (fieldConfig.type) {
        case "string":
          return (
            <Input
              value={
                condition.value !== undefined && condition.value !== null
                  ? String(condition.value)
                  : ""
              }
              onChange={(e) =>
                updateCondition(condition.id, { value: e.target.value })
              }
              placeholder={fieldConfig.placeholder || "Inserisci valore..."}
              className="flex-1"
            />
          );

        case "number":
          return (
            <Input
              type="number"
              value={
                (condition.value as
                  | string
                  | number
                  | readonly string[]
                  | undefined) || ""
              }
              onChange={(e) =>
                updateCondition(condition.id, { value: e.target.value })
              }
              placeholder={fieldConfig.placeholder || "Inserisci numero..."}
              className="flex-1"
            />
          );

        case "date":
          return (
            <Input
              type="date"
              value={
                condition.value !== undefined && condition.value !== null
                  ? String(condition.value)
                  : ""
              }
              onChange={(e) =>
                updateCondition(condition.id, { value: e.target.value })
              }
              className="flex-1"
            />
          );

        case "boolean":
          return (
            <Select
              value={condition.value?.toString() || ""}
              onValueChange={(value) =>
                updateCondition(condition.id, { value: value === "true" })
              }
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Seleziona valore..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Vero</SelectItem>
                <SelectItem value="false">Falso</SelectItem>
              </SelectContent>
            </Select>
          );

        case "select":
          if (["in", "nin"].includes(condition.operator)) {
            const selectedValues = Array.isArray(condition.value)
              ? condition.value
              : [];
            return (
              <div className="flex-1">
                <Select
                  onValueChange={(value) => {
                    const newValues = selectedValues.includes(value)
                      ? selectedValues.filter((v) => v !== value)
                      : [...selectedValues, value];
                    updateCondition(condition.id, { value: newValues });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        selectedValues.length > 0
                          ? `${selectedValues.length} selezionato/i`
                          : "Seleziona opzioni..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldConfig.options?.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedValues.includes(option.value)}
                          />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedValues.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedValues.map((value) => {
                      const option = fieldConfig.options?.find(
                        (opt) => opt.value === value
                      );
                      return (
                        <Badge
                          key={value}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => {
                            const newValues = selectedValues.filter(
                              (v) => v !== value
                            );
                            updateCondition(condition.id, { value: newValues });
                          }}
                        >
                          {option?.label || value}
                          <XIcon className="w-3 h-3 ml-1" />
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Select
              value={condition.value?.toString() || ""}
              onValueChange={(value) =>
                updateCondition(condition.id, { value })
              }
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Seleziona opzione..." />
              </SelectTrigger>
              <SelectContent>
                {fieldConfig.options?.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value.toString()}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );

        case "array": {
          return (
            <TagsInput
              initialTags={
                Array.isArray(condition.value) ? condition.value : []
              }
              onChange={(tags) =>
                updateCondition(condition.id, { value: tags })
              }
            />
          );
        }

        default:
          return null;
      }
    },
    [getFieldConfig, updateCondition]
  );

  const handleApplyFilters = useCallback(() => {
    onApplyFilters(conditions);
    onClose();
  }, [conditions, onApplyFilters, onClose]);

  const handleSaveView = useCallback(() => {
    if (!viewName.trim() || !onSaveView) return;

    onSaveView({
      name: viewName.trim(),
      description: viewDescription.trim() || undefined,
      conditions: [...conditions],
      id: generateShortId(),
    });

    setViewName("");
    setViewDescription("");
    setModalState("filters");
  }, [viewName, viewDescription, conditions, onSaveView]);

  const handleLoadView = useCallback(
    (viewId: string) => {
      const view = config.views?.find((v) => v.id === viewId);
      if (view && onLoadView) {
        onLoadView(view);
        setConditions([...view.conditions]);
        setSelectedView(viewId);
      }
    },
    [config.views, onLoadView]
  );

  const handleDeleteView = useCallback(() => {
    if (viewToDelete && onDeleteView) {
      onDeleteView(viewToDelete.id);
      setViewToDelete(null);
      setModalState("filters");
      if (selectedView === viewToDelete.id) {
        setSelectedView("");
      }
    }
  }, [viewToDelete, onDeleteView, selectedView]);

  const handleReset = useCallback(() => {
    setConditions([]);
    setSelectedView("");
  }, []);

  const handleBack = useCallback(() => {
    setModalState("filters");
    setViewName("");
    setViewDescription("");
    setViewToDelete(null);
  }, []);

  const handleClose = useCallback(() => {
    setModalState("filters");
    setViewName("");
    setViewDescription("");
    setViewToDelete(null);
    onClose();
  }, [onClose]);

  const activeFiltersCount = useMemo(() => {
    return conditions.filter((c) => {
      if (c.operator === "exists") return true;
      return (
        c.value !== "" &&
        c.value !== null &&
        c.value !== undefined &&
        !(Array.isArray(c.value) && c.value.length === 0)
      );
    }).length;
  }, [conditions]);

  const renderHeader = () => {
    switch (modalState) {
      case "create-view":
        return (
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-1 hover:bg-gray-100"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </Button>
            <SaveIcon className="w-5 h-5" />
            <div>
              <DialogTitle className="text-gray-900">
                Salva Nuova Vista
              </DialogTitle>
            </div>
          </div>
        );

      case "delete-view":
        return (
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-1 hover:bg-gray-100"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </Button>
            <AlertTriangleIcon className="w-5 h-5 text-red-500" />
            <div>
              <DialogTitle className="text-gray-900">Elimina Vista</DialogTitle>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center gap-3">
            <FilterIcon />
            <div>
              <DialogTitle className="text-gray-900">
                Filtri Avanzati
              </DialogTitle>
              {activeFiltersCount > 0 && (
                <div className="text-sm text-gray-500">
                  {activeFiltersCount} filtro
                  {activeFiltersCount !== 1 ? "i" : ""} attivo
                  {activeFiltersCount !== 1 ? "i" : ""}
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  const renderContent = () => {
    switch (modalState) {
      case "create-view":
        return (
          <ScrollArea className="flex-1 overflow-auto p-6">
            <div className="p-4 rounded-lg bg-blue-50 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Salva Nuova Vista</h4>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label
                    htmlFor="view-name"
                    className="text-sm font-medium text-gray-700"
                  >
                    Nome Vista *
                  </Label>
                  <Input
                    id="view-name"
                    value={viewName}
                    onChange={(e) => setViewName(e.target.value)}
                    placeholder="Es. Clienti Attivi Q1..."
                    className="bg-white"
                    autoFocus
                  />
                </div>
                <div>
                  <Label
                    htmlFor="view-description"
                    className="text-sm font-medium text-gray-700"
                  >
                    Descrizione
                  </Label>
                  <Input
                    id="view-description"
                    value={viewDescription}
                    onChange={(e) => setViewDescription(e.target.value)}
                    placeholder="Descrizione opzionale della vista..."
                    className="bg-white"
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
        );

      case "delete-view":
        return (
          <ScrollArea className="flex-1 overflow-auto p-6">
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 space-y-4">
              <div className="flex items-center gap-3">
                <AlertTriangleIcon className="w-5 h-5 text-red-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Elimina Vista</h4>
                  <p className="text-sm text-gray-600">
                    Questa azione non può essere annullata
                  </p>
                </div>
              </div>

              {viewToDelete && (
                <p className="text-sm text-gray-700">
                  Sei sicuro di voler eliminare la vista &quot;
                  <strong>{viewToDelete.name}</strong>&quot;?
                </p>
              )}
            </div>
          </ScrollArea>
        );

      default:
        return (
          <>
            {config.views && config.views.length > 0 && (
              <>
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">Viste Salvate</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      disabled={conditions.length === 0}
                    >
                      Reset
                    </Button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {config.views.map((view) => (
                      <Button
                        key={view.id}
                        variant={
                          selectedView === view.id ? "default" : "outline"
                        }
                        size="sm"
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.closest("[data-delete-view]")) {
                            e.stopPropagation();
                            setViewToDelete(view);
                            setModalState("delete-view");
                          } else {
                            handleLoadView(view.id);
                          }
                        }}
                        className="flex items-center gap-1 relative group pr-2"
                      >
                        <BookmarkIcon className="w-3 h-3" />
                        {view.name}
                        {onDeleteView && selectedView !== view.id && (
                          <span
                            data-delete-view
                            className="ml-2 text-red-500 hover:text-red-700 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-100 rounded p-1"
                          >
                            <TrashIcon className="w-3 h-3" />
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <ScrollArea className="flex-1 overflow-auto p-6">
              <div className="space-y-4">
                {conditions.map((condition, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="w-1/4">
                      <Select
                        value={condition.field}
                        onValueChange={(value) =>
                          updateCondition(condition.id, {
                            field: value,
                            operator:
                              getAvailableOperators(value)[0] || "equals",
                            value: "",
                          })
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Campo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {config.fields.map((field) => (
                            <SelectItem key={field.key} value={field.key}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-1/4">
                      <Select
                        value={condition.operator}
                        onValueChange={(value: FilterOperator) =>
                          updateCondition(condition.id, {
                            operator: value,
                            value: ["in", "nin"].includes(value) ? [] : "",
                          })
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Operatore..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableOperators(condition.field).map((op) => (
                            <SelectItem key={op} value={op}>
                              {OPERATOR_LABELS[op]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1">{renderValueInput(condition)}</div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(condition.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-9 w-9"
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={addCondition}
                  className="w-full flex items-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Aggiungi Filtro
                </Button>
              </div>
            </ScrollArea>
          </>
        );
    }
  };

  const renderFooter = () => {
    switch (modalState) {
      case "create-view":
        return (
          <div className="p-4 flex justify-end items-center gap-3">
            <Button variant="outline" onClick={handleClose}>
              Annulla
            </Button>
            <Button onClick={handleSaveView}>Salva</Button>
          </div>
        );

      case "delete-view":
        return (
          <div className="p-4 flex justify-end items-center gap-3">
            <Button variant="outline" onClick={handleClose}>
              Annulla
            </Button>
            <Button onClick={handleDeleteView}>Elimina</Button>
          </div>
        );

      default:
        return (
          <div className="p-4 flex justify-between items-center ">
            <div className="flex gap-2">
              {config.allowSaveViews && onSaveView && conditions.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setModalState("create-view")}
                  className="flex items-center gap-2"
                >
                  <SaveIcon className="w-4 h-4" />
                  Salva Vista
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose}>
                Annulla
              </Button>
              <Button onClick={handleApplyFilters}>
                Applica Filtri
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="p-0 bg-white rounded-lg shadow-lg flex flex-col max-w-4xl w-full">
        <DialogHeader className="flex flex-row justify-between items-center p-4">
          {renderHeader()}
          <DialogClose className="flex items-center gap-2 text-gray-500 hover:text-black transition cursor-pointer">
            <Badge
              variant="outline"
              className="bg-gray-100 text-gray-400 border-gray-400 font-medium px-2 py-0.5"
            >
              Esc
            </Badge>
            <XIcon className="w-5 h-5" />
          </DialogClose>
        </DialogHeader>

        <Separator className="w-full" />

        {renderContent()}

        <Separator className="w-full" />
        {renderFooter()}
      </DialogContent>
    </Dialog>
  );
}
