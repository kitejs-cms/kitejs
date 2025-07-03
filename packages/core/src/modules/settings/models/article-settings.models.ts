import {
  FieldDefinition,
  FilterFieldConfig,
  FilterView,
} from "../../../common";

export const ARTICLE_SETTINGS_KEY = "core:article";
export const PAGE_SETTINGS_KEY = "core:page";

export type ArticleSettingsModel = {
  customFields?: FieldDefinition[];
  filterFields?: FilterFieldConfig[];
  views?: FilterView[];
};
