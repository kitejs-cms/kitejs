export type TrackEventModel = {
  type: string;
  payload?: Record<string, any>;
  origin?: string;
  identifier?: string;
  duration?: number;
};
