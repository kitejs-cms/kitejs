import { PageResponseDetailsModel } from "@kitejs-cms/core/index";

export type PostResponseDetailsModel = PageResponseDetailsModel & {
  categories: string[];
  coverImage?: string;
};
