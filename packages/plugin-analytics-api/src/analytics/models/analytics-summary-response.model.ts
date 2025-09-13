export type AnalyticsSummaryResponseModel = {
  totalEvents: number;
  uniqueVisitors: number;
  newUsers: number;
  eventsByType: Record<string, number>;
};
