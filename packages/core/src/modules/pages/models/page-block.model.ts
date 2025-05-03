export type PageBlockModel = {
  id?: string;
  type: string;
  children?: Omit<PageBlockModel, "children">[];
  content?: Record<string, unknown>[];
  props?: Record<string, unknown>;
  style?: Record<string, unknown>;
};
