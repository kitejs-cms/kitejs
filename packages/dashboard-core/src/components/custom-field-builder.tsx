import React, { ReactElement, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import type { FieldType, FieldDefinition } from "@kitejs-cms/core/index";
import { useTranslation } from "react-i18next";
import { Badge } from "./ui/badge";
import {
  Plus,
  Trash2,
  GripVertical,
  Settings,
  Download,
  AlertCircle,
  CalendarDays,
  ToggleLeft,
  SquarePen,
  TextCursorInput,
  Palette,
  ALargeSmall,
} from "lucide-react";

const Alert = ({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "default" | "destructive";
  className?: string;
}) => {
  const variants = {
    default: "bg-blue-50 border-blue-200 text-blue-800",
    destructive: "bg-red-50 border-red-200 text-red-800",
  };

  return (
    <div
      className={`relative w-full rounded-lg border p-4 ${variants[variant]} ${className}`}
    >
      {children}
    </div>
  );
};

const FIELD_TYPES: { value: FieldType; label: string; icon: ReactElement }[] = [
  {
    value: "text",
    label: "custom-field-builder.fieldTypes.text",
    icon: <SquarePen />,
  },
  {
    value: "textarea",
    label: "custom-field-builder.fieldTypes.textarea",
    icon: <ALargeSmall />,
  },
  {
    value: "rich-text",
    label: "custom-field-builder.fieldTypes.richText",
    icon: <Palette />,
  },
  {
    value: "number",
    label: "custom-field-builder.fieldTypes.number",
    icon: <TextCursorInput />,
  },
  {
    value: "boolean",
    label: "custom-field-builder.fieldTypes.boolean",
    icon: <ToggleLeft />,
  },
  {
    value: "date",
    label: "custom-field-builder.fieldTypes.date",
    icon: <CalendarDays />,
  },
];

interface CustomFieldBuilderProps {
  value: FieldDefinition[];
  onChange: (fields: FieldDefinition[]) => void;
}

const FieldPreview: React.FC<{
  field: FieldDefinition;
  onRemove: () => void;
  onEdit: () => void;
}> = ({ field, onRemove, onEdit }) => {
  const { t } = useTranslation("components");
  const typeInfo = FIELD_TYPES.find((t) => t.value === field.type);

  return (
    <div className="group bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-lg text-sm">
            {typeInfo?.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {field.label}
              </h4>
              {field.required && (
                <Badge variant="outline" className="text-xs font-normal">
                  {t("custom-field-builder.general.required")}
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {field.key} • {t(typeInfo?.label || "")}
            </p>
            {field.description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {field.description}
              </p>
            )}
            {field.validation && (
              <div className="flex flex-wrap gap-1 mt-2">
                {field.validation.minLength && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {t("custom-field-builder.indicators.min")}:{" "}
                    {field.validation.minLength}
                  </Badge>
                )}
                {field.validation.maxLength && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {t("custom-field-builder.indicators.max")}:{" "}
                    {field.validation.maxLength}
                  </Badge>
                )}
                {field.validation.minValue !== undefined && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {t("custom-field-builder.indicators.min")}:{" "}
                    {field.validation.minValue}
                  </Badge>
                )}
                {field.validation.maxValue !== undefined && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {t("custom-field-builder.indicators.max")}:{" "}
                    {field.validation.maxValue}
                  </Badge>
                )}
                {field.validation.pattern && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {t("custom-field-builder.indicators.pattern")}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8 text-gray-400 hover:text-blue-600"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 text-gray-400 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <div className="cursor-grab p-1.5 text-gray-400 hover:text-gray-600">
            <GripVertical className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

const FieldForm: React.FC<{
  field?: FieldDefinition;
  onSave: (field: FieldDefinition) => void;
  onCancel: () => void;
  existingKeys: string[];
}> = ({ field, onSave, onCancel, existingKeys }) => {
  const { t } = useTranslation("components");

  const [formData, setFormData] = useState<FieldDefinition>(
    field || {
      key: "",
      label: "",
      type: "text",
      required: false,
      defaultValue: "",
      placeholder: "",
      description: "",
      validation: {},
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const toCamelCase = (str: string): string => {
    const cleaned = str.replace(/[^a-zA-Z0-9\s]/g, "");

    return cleaned
      .split(/\s+/)
      .map((word, index) => {
        if (index === 0) {
          return word.charAt(0).toLowerCase() + word.slice(1);
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join("");
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.key.trim()) {
      newErrors.key = t("custom-field-builder.errors.keyRequired");
    } else if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(formData.key)) {
      newErrors.key = t("custom-field-builder.errors.keyInvalidFormat");
    } else if (
      existingKeys.includes(formData.key) &&
      (!field || field.key !== formData.key)
    ) {
      newErrors.key = t("custom-field-builder.errors.keyAlreadyExists");
    }

    if (!formData.label.trim()) {
      newErrors.label = t("custom-field-builder.errors.labelRequired");
    }

    if (formData.validation?.minLength && formData.validation?.maxLength) {
      if (formData.validation.minLength > formData.validation.maxLength) {
        newErrors.validation = t(
          "custom-field-builder.errors.minLengthGreaterThanMax"
        );
      }
    }

    if (formData.validation?.minValue && formData.validation?.maxValue) {
      if (formData.validation.minValue > formData.validation.maxValue) {
        newErrors.validation = t(
          "custom-field-builder.errors.minValueGreaterThanMax"
        );
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const cleanValidation = Object.fromEntries(
        Object.entries(formData.validation || {}).filter(
          ([, value]) => value !== undefined && value !== ""
        )
      );

      onSave({
        ...formData,
        validation:
          Object.keys(cleanValidation).length > 0 ? cleanValidation : undefined,
      });
    }
  };

  const updateField = (updates: Partial<FieldDefinition>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const updateValidation = (
    validation: Partial<FieldDefinition["validation"]>
  ) => {
    setFormData((prev) => ({
      ...prev,
      validation: { ...prev.validation, ...validation },
    }));
  };

  const handleKeyChange = (value: string) => {
    const camelCaseKey = toCamelCase(value);
    updateField({ key: camelCaseKey });
  };

  const showTextValidation = ["text", "textarea", "rich-text"].includes(
    formData.type
  );
  const showNumberValidation = formData.type === "number";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {field
            ? t("custom-field-builder.titles.editField")
            : t("custom-field-builder.titles.newField")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="key">
              {t("custom-field-builder.labels.fieldKey")} *
            </Label>
            <Input
              id="key"
              value={formData.key}
              onChange={(e) => handleKeyChange(e.target.value)}
              placeholder={t("custom-field-builder.placeholders.fieldKey")}
              className={errors.key ? "border-red-300" : ""}
            />
            {errors.key && <p className="text-red-600 text-xs">{errors.key}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">
              {t("custom-field-builder.labels.fieldLabel")} *
            </Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => updateField({ label: e.target.value })}
              placeholder={t("custom-field-builder.placeholders.fieldLabel")}
              className={errors.label ? "border-red-300" : ""}
            />
            {errors.label && (
              <p className="text-red-600 text-xs">{errors.label}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label>{t("custom-field-builder.labels.fieldType")} *</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FIELD_TYPES.map((type) => (
              <Button
                key={type.value}
                variant={formData.type === type.value ? "default" : "outline"}
                className="h-auto p-3 justify-start"
                onClick={() => updateField({ type: type.value })}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{type.icon}</span>
                  <span className="text-sm font-medium">{t(type.label)}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="required"
              checked={formData.required || false}
              onCheckedChange={(checked) =>
                updateField({ required: checked as boolean })
              }
            />
            <Label htmlFor="required">
              {t("custom-field-builder.labels.requiredField")}
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="placeholder">
              {t("custom-field-builder.labels.placeholder")}
            </Label>
            <Input
              id="placeholder"
              value={formData.placeholder || ""}
              onChange={(e) => updateField({ placeholder: e.target.value })}
              placeholder={t("custom-field-builder.placeholders.placeholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {t("custom-field-builder.labels.description")}
            </Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => updateField({ description: e.target.value })}
              placeholder={t("custom-field-builder.placeholders.description")}
              rows={3}
            />
          </div>
        </div>

        {(showTextValidation || showNumberValidation) && (
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">
              {t("custom-field-builder.titles.validationRules")}
            </h4>

            {showTextValidation && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minLength">
                    {t("custom-field-builder.labels.minLength")}
                  </Label>
                  <Input
                    id="minLength"
                    type="number"
                    min="0"
                    value={formData.validation?.minLength || ""}
                    onChange={(e) =>
                      updateValidation({
                        minLength: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLength">
                    {t("custom-field-builder.labels.maxLength")}
                  </Label>
                  <Input
                    id="maxLength"
                    type="number"
                    min="0"
                    value={formData.validation?.maxLength || ""}
                    onChange={(e) =>
                      updateValidation({
                        maxLength: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="pattern">
                    {t("custom-field-builder.labels.pattern")}
                  </Label>
                  <Input
                    id="pattern"
                    value={formData.validation?.pattern || ""}
                    onChange={(e) =>
                      updateValidation({ pattern: e.target.value })
                    }
                    placeholder={t("custom-field-builder.placeholders.pattern")}
                  />
                </div>
              </div>
            )}

            {showNumberValidation && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minValue">
                    {t("custom-field-builder.labels.minValue")}
                  </Label>
                  <Input
                    id="minValue"
                    type="number"
                    value={formData.validation?.minValue || ""}
                    onChange={(e) =>
                      updateValidation({
                        minValue: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxValue">
                    {t("custom-field-builder.labels.maxValue")}
                  </Label>
                  <Input
                    id="maxValue"
                    type="number"
                    value={formData.validation?.maxValue || ""}
                    onChange={(e) =>
                      updateValidation({
                        maxValue: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
              </div>
            )}

            {errors.validation && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="ml-2">{errors.validation}</span>
              </Alert>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button variant="outline" onClick={onCancel}>
            {t("custom-field-builder.general.cancel")}
          </Button>
          <Button onClick={handleSubmit}>
            {field
              ? t("custom-field-builder.actions.updateField")
              : t("custom-field-builder.actions.createField")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export function CustomFieldBuilder({
  value,
  onChange,
}: CustomFieldBuilderProps) {
  const { t } = useTranslation("components");
  const [showForm, setShowForm] = useState(false);
  const [editingField, setEditingField] = useState<
    FieldDefinition | undefined
  >();

  const handleSaveField = (field: FieldDefinition) => {
    let newFields: FieldDefinition[];

    if (editingField) {
      newFields = value.map((f) => (f.key === editingField.key ? field : f));
    } else {
      newFields = [...value, field];
    }

    onChange(newFields);
    setShowForm(false);
    setEditingField(undefined);
  };

  const handleEditField = (field: FieldDefinition) => {
    setEditingField(field);
    setShowForm(true);
  };

  const handleRemoveField = (key: string) => {
    const newFields = value.filter((f) => f.key !== key);
    onChange(newFields);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingField(undefined);
  };

  const exportConfiguration = () => {
    const config = {
      customFields: value,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "custom-fields-config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const existingKeys = value.map((f) => f.key);

  if (showForm) {
    return (
      <FieldForm
        field={editingField}
        onSave={handleSaveField}
        onCancel={handleCancel}
        existingKeys={existingKeys}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>
            {t("custom-field-builder.titles.customFields")} ({value.length})
          </CardTitle>

          <div className="flex space-x-3">
            {value.length > 0 && (
              <Button variant="outline" onClick={exportConfiguration}>
                <Download className="w-4 h-4 mr-2" />
                {t("custom-field-builder.general.export")}
              </Button>
            )}
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t("custom-field-builder.actions.addField")}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {value.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("custom-field-builder.titles.noCustomFields")}
            </h3>
            <p className="text-gray-500 mb-6">
              {t("custom-field-builder.titles.createFirstField")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {value.map((field) => (
              <FieldPreview
                key={field.key}
                field={field}
                onEdit={() => handleEditField(field)}
                onRemove={() => handleRemoveField(field.key)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
