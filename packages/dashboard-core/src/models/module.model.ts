import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { SettingsModel } from "./settings.model";

export interface ModuleRouteModel {
  path: string;
  element: ReactNode;
  label: string;
  icon?: ReactNode;
  requiredPermissions?: string[];
  children?: ModuleRouteModel[];
}

export interface SidebarMenuItemModel {
  title: string;
  url?: string;
  icon: LucideIcon;
  requiredPermissions?: string[];
  items?: Omit<SidebarMenuItemModel, "items">[];
}

export interface DashboardModule {
  key: string;
  name: string;
  routes: ModuleRouteModel[];
  settings?: SettingsModel;
  menuItem?: SidebarMenuItemModel;
  translations?: {
    [lang: string]: { [key: string]: string } | unknown;
  };
}
