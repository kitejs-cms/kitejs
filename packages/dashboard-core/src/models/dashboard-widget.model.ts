import { ReactNode } from "react";

export type DashboardWidgetModel = {
  key: string;
  component: ReactNode;
  /**
   * Default number of grid columns the widget should span when first added.
   * Valid values: 1-3
   */
  defaultWidth?: number;
};
