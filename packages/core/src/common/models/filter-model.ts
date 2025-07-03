export type FilterOperator =
  | "equals" // Valore uguale (default)
  | "ne" // Not equals
  | "gt" // Greater than
  | "gte" // Greater than or equal
  | "lt" // Less than
  | "lte" // Less than or equal
  | "in" // In array
  | "nin" // Not in array
  | "contains" // Contains text (regex)
  | "startswith" // Starts with text
  | "endswith" // Ends with text
  | "exists" // Field exists
  | "regex"; // Custom regex

export type FilterFieldType =
  | "string"
  | "number"
  | "date"
  | "boolean"
  | "select"
  | "array";

export type FilterOption = {
  value: string | number;
  label: string;
};

export type FilterCondition = {
  id: string;
  field: string;
  operator: FilterOperator;
  value: unknown;
};

export type FilterView = {
  id: string;
  name: string;
  description?: string;
  conditions: FilterCondition[];
};

export type FilterFieldConfig = {
  key: string;
  label: string;
  type: FilterFieldType;
  operators?: FilterOperator[];
  options?: FilterOption[];
  placeholder?: string;
  required?: boolean;
};
