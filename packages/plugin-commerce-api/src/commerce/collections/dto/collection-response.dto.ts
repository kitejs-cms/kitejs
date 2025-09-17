export interface CollectionTranslationEntry {
  [key: string]: unknown;
}

export interface CollectionTranslationsMap {
  [language: string]: CollectionTranslationEntry;
}

export interface CollectionResponse {
  id: string;
  slugs: Record<string, string>;
  translations: CollectionTranslationsMap;
  [key: string]: unknown;
}
