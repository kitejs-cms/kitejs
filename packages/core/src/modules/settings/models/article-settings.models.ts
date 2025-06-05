import { FieldDefinition } from "../../../common";

export const ARTICLE_SETTINGS_KEY = "core:article";

export type ArticleSettingsModel = {
  customFields?: FieldDefinition[]
};
