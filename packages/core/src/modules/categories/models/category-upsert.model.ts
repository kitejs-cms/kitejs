export type CategoryUpsertModel = {
  id?: string;
  slug: string;
  language: string;
  tags: string[];
  title: string;
  description: string;
  isActive: boolean
};
