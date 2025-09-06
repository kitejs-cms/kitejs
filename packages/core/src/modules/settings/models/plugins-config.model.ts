export const PLUGINS_CONFIG_KEY = "core:plugins-config";

export interface PluginsConfigModel {
  restartRequired: boolean;
  plugins: Record<string, { enabled: boolean }>;
}
