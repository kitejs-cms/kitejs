export type ComponentConfig = {
  props: Record<string, { type: string; default?: any }>;
};

export type ThemeConfig = {
  name: string;
  description: string;
  components: Record<string, ComponentConfig>;
};
