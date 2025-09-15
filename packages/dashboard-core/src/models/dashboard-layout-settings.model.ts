export interface DashboardWidgetLayout {
  key: string;
  /**
   * Number of grid columns the widget should span. Valid values: 1-3
   */
  width: number;
  /**
   * Number of grid rows the widget should span. Valid values: 1-2
   */
  height: number;
}

export interface DashboardLayoutSettingsModel {
  widgets: DashboardWidgetLayout[];
  menu: string[];
}

