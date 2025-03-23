import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { SettingsModel } from "./settings.model";

export interface ModuleRoute {
  path: string;
  element: ReactNode;
  label: string;
  icon?: ReactNode;
  children?: ModuleRoute[];
}

export interface SidebarMenuItem {
  title: string;
  url?: string;
  icon: LucideIcon;
  items?: Omit<SidebarMenuItem, "items">[];
}

export interface DashboardModule {
  key: string;
  name: string;
  routes: ModuleRoute[];
  settings?: SettingsModel;
  menuItem?: SidebarMenuItem;
  translations?: {
    [lang: string]: { [key: string]: string } | unknown;
  };
}
