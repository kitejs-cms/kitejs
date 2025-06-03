export type FieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'textarea'
  | 'rich-text';

export type FieldDefinition = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  defaultValue?: any;
  placeholder?: string;
  description?: string;

  validation?: {
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    pattern?: string;
  };
}