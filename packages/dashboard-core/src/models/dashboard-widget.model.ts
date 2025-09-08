import { ReactNode } from "react";

export type DashboardWidgetModel = {
  key: string;
  component: ReactNode;
  /**
   * Default number of grid columns the widget should span when first added.
   * Valid values: 1-3
   */
  defaultWidth?: number;
  /**
   * Default number of grid rows the widget should span when first added.
   * Valid values: 1-2
   */
  defaultHeight?: number;
  /**
   * Minimum number of grid columns the widget can be resized to.
   * Defaults to 1. Valid values: 1-3
   */
  minWidth?: number;
  /**
   * Minimum number of grid rows the widget can be resized to.
   * Defaults to 1. Valid values: 1-2
   */
  minHeight?: number;
};
