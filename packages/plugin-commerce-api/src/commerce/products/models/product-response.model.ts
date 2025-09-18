export type ProductResponseModel = {
  id: string;
  slugs: Record<string, string>;
  translations: Record<string, Record<string, unknown>>;
  createdAt: Date;
  updatedAt: Date;
};
