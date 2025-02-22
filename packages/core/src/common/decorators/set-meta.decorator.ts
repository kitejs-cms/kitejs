import { SetMetadata } from "@nestjs/common";

export const SET_META_KEY = "customMeta";

export const SetMeta = (meta: Record<string, any>) =>
  SetMetadata(SET_META_KEY, meta);
