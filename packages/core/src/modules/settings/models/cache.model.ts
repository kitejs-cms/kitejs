export const CACHE_SETTINGS_KEY = "core:cache";

export type CacheSettingsModel = {
  enabled: boolean;
  ttl: number;
};
