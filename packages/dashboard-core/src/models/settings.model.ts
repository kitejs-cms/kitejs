import { ReactNode } from "react";

export type SettingsModel = {
  key: string;
  title: string;
  icon?: ReactNode;
  children?: Omit<SettingsModel, "children">[];
  component?: ReactNode;
  description?: string;
};
