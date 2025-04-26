import { PageResponseDetailsModel } from "./page-response-details.model";

export type PageRevisionModel = {
  id: string;
  pageId: string;
  version: number;
  data: PageResponseDetailsModel;
  modifiedBy: string;
  timestamp: string;
};
