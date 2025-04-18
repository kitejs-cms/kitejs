import { PageBlockModel } from "./page-block.model";
import { PageStatus } from "./page-detail.model";
import { PageSeoModel } from "./page-seo.model";

export type PageResponseModel = {
  slug: string;
  status: PageStatus;
  tags?: string[];
  publishAt?: string;
  title: string;
  description: string;
  blocks: PageBlockModel[];
  seo: PageSeoModel;
  language: string;
};
