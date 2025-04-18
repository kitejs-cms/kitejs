import { PageBlockModel } from "./page-block.model";
import { PageSeoModel } from "./page-seo.model";

export interface PageTranslationModel {
  title: string;
  description: string;
  blocks: PageBlockModel[];
  seo: PageSeoModel;
}
