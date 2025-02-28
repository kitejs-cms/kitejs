export const CMS_SETTINGS_KEY = "core:cms";

export type CmsSettingsModel = {
  siteName: string;
  siteUrl: string;
  siteDescription?: string;
  defaultLanguage: string;
  allowIndexing: boolean;
};
