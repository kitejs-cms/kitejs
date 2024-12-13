import { SetMetadata } from "@nestjs/common";

export const SetMeta = (meta: Record<string, any>) =>
  SetMetadata("customMeta", meta);
