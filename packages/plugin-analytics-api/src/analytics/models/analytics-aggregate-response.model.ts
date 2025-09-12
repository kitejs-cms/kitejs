export interface AnalyticsAggregateResponseModel {
  totalEvents: number;
  uniqueVisitors: number;
  eventsByIdentifier: Record<
    string,
    {
      count: number;
      /** Average duration in seconds */
      duration?: number;
    }
  >;
  eventsByType: Record<
    string,
    {
      count: number;
      /** Average duration in seconds */
      duration?: number;
    }
  >;
}
