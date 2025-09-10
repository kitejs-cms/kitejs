export interface AnalyticsAggregateResponseModel {
  totalEvents: number;
  uniqueVisitors: number;
  eventsByIdentifier: Record<string, number>;
}
