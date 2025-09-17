export interface ProductTranslationEntry {
  [key: string]: unknown;
}

export interface ProductTranslationsMap {
  [language: string]: ProductTranslationEntry;
}

export interface ProductResponse {
  id: string;
  slugs: Record<string, string>;
  translations: ProductTranslationsMap;
  [key: string]: unknown;
}
