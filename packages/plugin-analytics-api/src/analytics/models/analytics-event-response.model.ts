export type AnalyticsEventResponseModel = {
  id: string;
  type: string;
  payload?: Record<string, any>;
  userAgent?: string;
  origin?: string;
  identifier?: string;
  duration?: number;
  ip?: string;
  geo?: Record<string, any>;
  fingerprint?: string;
  browser?: string;
  os?: string;
  device?: string;
  country?: string;
  region?: string;
  city?: string;
  createdAt: Date;
};
