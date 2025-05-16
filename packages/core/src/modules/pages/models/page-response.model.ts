import { PageBlockModel } from "./page-block.model";
import { PageSeoModel } from "./page-seo.model";
import { PageStatus } from "./page-status.enum";

export type PageResponseModel = {
  slug: string;
  image?: string
  status: PageStatus;
  tags: string[];
  publishAt?: string;
  title: string;
  description: string;
  blocks: PageBlockModel[];
  seo?: PageSeoModel;
  language: string;
};
