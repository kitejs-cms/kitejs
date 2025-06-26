import { FieldDefinition, FieldType } from "../models/field.model";

/**
 * Converts a single value to the appropriate type with automatic type detection.
 * Handles common conversion scenarios and edge cases.
 */
function convertValue(value: any, type: FieldType): any {
  // Handle null/undefined/empty values
  if (value === null || value === undefined) {
    return null;
  }

  // Handle empty strings
  if (
    value === "" &&
    type !== "text" &&
    type !== "textarea" &&
    type !== "rich-text"
  ) {
    return null;
  }

  try {
    switch (type) {
      case "text":
      case "textarea":
      case "rich-text":
        return String(value);

      case "number":
        if (typeof value === "number") return value;
        if (typeof value === "string") {
          // Handle empty string as null
          if (value.trim() === "") return null;
          const parsed = parseFloat(value);
          if (isNaN(parsed)) return null;
          return parsed;
        }
        if (typeof value === "boolean") return value ? 1 : 0;
        return null;

      case "boolean":
        if (typeof value === "boolean") return value;
        if (typeof value === "number") return value !== 0;
        if (typeof value === "string") {
          const lower = value.toLowerCase().trim();
          if (["true", "1", "yes", "on"].includes(lower)) return true;
          if (["false", "0", "no", "off"].includes(lower)) return false;
          return null;
        }
        return Boolean(value);

      case "date":
        if (value instanceof Date) return value;
        if (typeof value === "string" || typeof value === "number") {
          const date = new Date(value);
          return isNaN(date.getTime()) ? null : date;
        }
        return null;

      default:
        return value;
    }
  } catch (error) {
    return null;
  }
}

/**
 * Validates a single field value according to its definition.
 * Returns an error message if validation fails, null if valid.
 */
function validateField(field: FieldDefinition, value: any): string | null {
  // Check required fields
  if (
    field.required &&
    (value === null || value === undefined || value === "")
  ) {
    return `Field '${field.key}' is required`;
  }

  // Skip validation for null/empty optional fields
  if (
    !field.required &&
    (value === null || value === undefined || value === "")
  ) {
    return null;
  }

  const validation = field.validation;
  if (!validation) return null;

  switch (field.type) {
    case "text":
    case "textarea":
    case "rich-text":
      const strValue = String(value);
      if (validation.minLength && strValue.length < validation.minLength) {
        return `Field '${field.key}' must be at least ${validation.minLength} characters`;
      }
      if (validation.maxLength && strValue.length > validation.maxLength) {
        return `Field '${field.key}' must not exceed ${validation.maxLength} characters`;
      }
      if (
        validation.pattern &&
        !new RegExp(validation.pattern).test(strValue)
      ) {
        return `Field '${field.key}' format is invalid`;
      }

      break;

    case "date":
      if (!(value instanceof Date) || isNaN(value.getTime())) {
        return `Field '${field.key}' must be a valid date`;
      }
      if (validation.minValue && value < new Date(validation.minValue)) {
        return `Field '${field.key}' must be after ${new Date(validation.minValue).toISOString()}`;
      }
      if (validation.maxValue && value > new Date(validation.maxValue)) {
        return `Field '${field.key}' must be before ${new Date(validation.maxValue).toISOString()}`;
      }
      break;

    case "boolean":
      if (typeof value !== "boolean") {
        return `Field '${field.key}' must be a boolean value`;
      }
      break;

    case "number":
      const numValue = Number(value);
      if (validation.minValue !== undefined && numValue < validation.minValue) {
        return `Field '${field.key}' must be at least ${validation.minValue}`;
      }
      if (validation.maxValue !== undefined && numValue > validation.maxValue) {
        return `Field '${field.key}' must not exceed ${validation.maxValue}`;
      }
      break;
  }

  return null;
}

/**
 * Helper function to validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Helper function to validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Main utility function that processes custom fields with automatic conversion and validation.
 * Simplified version that handles all conversions automatically.
 */
export function processCustomFields(
  customFields: FieldDefinition[],
  rawData: Record<string, any>
): Record<string, any> {
  if (customFields.length === 0) {
    return {};
  }

  const result: Record<string, any> = {};
  const errors: string[] = [];

  // Create a map for quick field lookup
  const fieldsMap = new Map(customFields.map((field) => [field.key, field]));

  // Process only fields that are defined in customFields
  for (const field of customFields) {
    const rawValue = rawData[field.key];

    // Convert the value
    const convertedValue = convertValue(rawValue, field.type);

    // Apply default value if needed
    if (convertedValue === null && field.defaultValue !== undefined) {
      result[field.key] = convertValue(field.defaultValue, field.type);
    } else {
      result[field.key] = convertedValue;
    }

    // Validate the final value
    const validationError = validateField(field, result[field.key]);
    if (validationError) {
      errors.push(validationError);
    }
  }

  // Throw aggregated errors
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join("; ")}`);
  }

  return result;
}
