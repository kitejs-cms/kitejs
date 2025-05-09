import { PageUpsertModel } from "@kitejs-cms/core/index";

export type PostUpsertModel = PageUpsertModel & {
  categories: string[];
  coverImage?: string;
};
