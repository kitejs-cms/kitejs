import { PageBlockModel } from "./page-block.model";
import { PageSeoModel } from "./page-seo.model";
import { PageStatus } from "./page-status.enum";

export type PageUpsertModel = {
  id?: string;
  type?: string
  slug: string;
  language: string;
  status: PageStatus;
  tags?: string[];
  image?: string
  publishAt?: string;
  expireAt?: string;
  title: string;
  description: string;
  blocks: PageBlockModel[];
  seo?: PageSeoModel;
  categories?: string[]
};
