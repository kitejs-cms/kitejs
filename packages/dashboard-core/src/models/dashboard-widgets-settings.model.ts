export interface DashboardWidgetLayout {
  key: string;
  /**
   * Number of grid columns the widget should span. Valid values: 1-3
   */
  width: number;
}

export interface DashboardWidgetsSettingsModel {
  widgets: DashboardWidgetLayout[];
}
