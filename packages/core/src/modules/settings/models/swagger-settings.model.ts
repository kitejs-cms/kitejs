export const SWAGGER_SETTINGS_KEY = "core:swagger";

export type SwaggerSettingsModel = {
  enabled: boolean;
  title: string;
  description: string;
  version: string;
  path: string;
};
