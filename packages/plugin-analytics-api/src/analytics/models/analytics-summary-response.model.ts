export type AnalyticsSummaryResponseModel = {
  totalEvents: number;
  uniqueVisitors: number;
  eventsByType: Record<string, number>;
};
