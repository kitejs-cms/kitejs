export type AnalyticsPluginSettingsModel = {
  apiKey: string;
  /** Number of days to retain analytics data before pruning */
  retentionDays: number;
};
