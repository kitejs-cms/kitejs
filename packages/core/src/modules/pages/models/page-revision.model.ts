import { PageDetailModel } from "./page-detail.model";

export type PageRevisionModel = {
  id: string;
  pageId: string;
  version: number;
  data: PageDetailModel;
  modifiedBy: string;
  timestamp: string;
};
