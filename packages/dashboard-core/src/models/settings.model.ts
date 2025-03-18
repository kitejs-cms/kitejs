import { ReactNode } from "react";

export type SettingsModel = {
  id: string;
  title: string;
  icon?: ReactNode;
  children?: Omit<SettingsModel, "children">[];
  component?: ReactNode;
  description?: string;
};
