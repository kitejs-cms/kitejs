/**
 * Utility functions for handling localized (multilingual) fields.
 * Works with both Map<string, string> (Mongo schema) and Record<string, string> (DTO).
 */

/**
 * Returns the localized string for a given language.
 * Falls back to undefined if not available.
 */
export function getLocalizedValue(
  field?: Map<string, string> | Record<string, string> | null,
  lang?: string
): string | undefined {
  if (!field || !lang) return undefined;

  if (field instanceof Map) {
    return field.get(lang) ?? undefined;
  }

  if (typeof field === "object") {
    return field[lang] ?? undefined;
  }

  return undefined;
}

/**
 * Sets or updates a localized value for a given language key.
 * Returns a new Map without mutating the original.
 */
export function setLocalizedValue(
  existing: Map<string, string> | Record<string, string> | undefined,
  lang: string,
  value: string
): Map<string, string> {
  const map = new Map(
    existing instanceof Map ? existing : Object.entries(existing ?? {})
  );

  if (value && value.trim() !== "") {
    map.set(lang, value.trim());
  }

  return map;
}

/**
 * Merges an object of translations into an existing Map.
 * Example:
 *   mergeLocalizedMap(Map { "en" => "Dog" }, { "it": "Cane" })
 *   => Map { "en" => "Dog", "it" => "Cane" }
 */
export function mergeLocalizedMap(
  existing: Map<string, string> | undefined,
  updates: Record<string, string>
): Map<string, string> {
  const map = new Map(existing ?? []);
  for (const [lang, value] of Object.entries(updates)) {
    if (value && value.trim() !== "") {
      map.set(lang, value.trim());
    }
  }
  return map;
}
