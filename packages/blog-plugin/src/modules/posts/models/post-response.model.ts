import { PageResponseModel } from "@kitejs-cms/core/index";

export type PostResponseModel = PageResponseModel & {
  categories: string[];
  coverImage?: string;
};
