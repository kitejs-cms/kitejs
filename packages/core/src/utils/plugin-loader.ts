export interface PluginConfig {
  name: string;
  enabled: boolean;
  settings?: Record<string, any>;
}

export function loadPlugins(plugins: PluginConfig[] = []): PluginConfig[] {
  plugins.unshift({
    name: "core",
    enabled: true,
  });

  return plugins;
}

export function getEnabledPlugins(
  plugins: PluginConfig[] = []
): PluginConfig[] {
  return loadPlugins(plugins).filter((plugin) => plugin.enabled);
}
