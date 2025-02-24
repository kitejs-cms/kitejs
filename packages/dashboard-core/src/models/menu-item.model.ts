import { type LucideIcon } from "lucide-react";

export type MenuItemModel = {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
  }[];
};
