export type AnalyticsPluginSettingsModel = {
  apiKey: string;
  /** Number of days to retain analytics data before pruning */
  retentionDays: number | null;
  /** Optional mapping between event type keys and custom labels */
  eventTypeLabels?: Record<string, string>;
};
