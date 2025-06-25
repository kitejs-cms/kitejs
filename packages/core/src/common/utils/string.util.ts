/**
 * Check if string is a valid ISO date string
 */
export function isISODateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/.test(value);
}

/**
 * Check if string represents a number
 */
export function isNumericString(value: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(value);
}

/**
 * Check if string is a valid MongoDB ObjectId
 */
export function isObjectIdString(value: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(value);
}
