export type PageBlockModel = {
  type: string;
  order: number;
  content?: unknown;
  settings?: Record<string, any>;
};
