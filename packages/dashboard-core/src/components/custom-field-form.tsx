import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Separator } from "./ui/separator";
import { HTMLEditor } from "./html-editor/html-editor";
import { Palette, AlertCircle } from "lucide-react";
import type { FieldDefinition } from "@kitejs-cms/core/index";

export type FieldValue = string | number | boolean | Date | null | undefined;

export interface FormValues {
  [key: string]: FieldValue;
}

interface FieldComponentProps {
  field: FieldDefinition;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  error?: string;
}

const FieldComponent: React.FC<FieldComponentProps> = ({
  field,
  value,
  onChange,
  error,
}) => {
  const commonProps = {
    id: field.key,
    placeholder: field.placeholder,
    className: error ? "border-red-300" : "",
  };

  const renderField = () => {
    switch (field.type) {
      case "text":
        return (
          <Input
            {...commonProps}
            type="text"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case "textarea":
        return (
          <Textarea
            {...commonProps}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
          />
        );

      case "rich-text":
        return (
          <HTMLEditor
            content={(value as string) || ""}
            onChange={onChange}
            placeholder={field.placeholder}
            className={error ? "border-red-300" : ""}
          />
        );

      case "number":
        return (
          <Input
            {...commonProps}
            type="number"
            value={value !== undefined && value !== null ? String(value) : ""}
            onChange={(e) => {
              const val = e.target.value;
              onChange(val === "" ? undefined : parseFloat(val));
            }}
            min={field.validation?.minValue}
            max={field.validation?.maxValue}
          />
        );

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.key}
              checked={(value as boolean) || false}
              onCheckedChange={onChange}
            />
            <Label htmlFor={field.key} className="text-sm font-normal">
              {field.description || `Abilita ${field.label}`}
            </Label>
          </div>
        );

      case "date":
        return (
          <Input
            {...commonProps}
            type="datetime-local"
            value={
              value
                ? new Date(value as string | Date).toISOString().slice(0, 16)
                : ""
            }
            onChange={(e) => {
              const val = e.target.value;
              onChange(val ? new Date(val) : undefined);
            }}
          />
        );

      default:
        return (
          <Input
            {...commonProps}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      {field.type !== "boolean" && (
        <Label htmlFor={field.key}>
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {renderField()}

      {field.description && field.type !== "boolean" && (
        <p className="text-xs text-gray-500">{field.description}</p>
      )}

      {error && (
        <p className="text-red-600 text-xs flex items-center space-x-1">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

interface CustomFieldFormProps {
  fields: FieldDefinition[];
  values: FormValues;
  onChange: (values: FormValues) => void;
  errors?: Record<string, string>;
  title?: string;
  className?: string;
}

export const CustomFieldForm: React.FC<CustomFieldFormProps> = ({
  fields,
  values,
  onChange,
  errors = {},
  title = "Custom Fields",
  className = "",
}) => {
  if (fields.length === 0) return null;

  const handleFieldChange = (fieldKey: string, value: FieldValue) => {
    onChange({ [fieldKey]: value });
  };

  return (
    <Card className={`w-full shadow-neutral-50 gap-0 py-0 ${className}`}>
      <CardHeader className="bg-secondary text-primary py-4 rounded-t-xl">
        <CardTitle className="flex items-center space-x-2">
          <Palette className="w-5 h-5" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>

      <Separator />

      <CardContent className="p-4 md:p-6">
        <div className="space-y-4">
          {fields.map((field) => (
            <FieldComponent
              key={field.key}
              field={field}
              value={values[field.key]}
              onChange={(value) => handleFieldChange(field.key, value)}
              error={errors[field.key]}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
