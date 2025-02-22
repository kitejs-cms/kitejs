export type SettingModel<T = Record<string, unknown>> = {
  key: string;
  value: T;
};
