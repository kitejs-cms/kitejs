export const STORAGE_SETTINGS_KEY = "core:storage";

export type LocalStorageSettings = {
  uploadPath: string;
};

export type S3StorageSettings = {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  forcePathStyle?: boolean;
};

export type StorageSettingsModel = {
  provider: "local" | "s3";
  local?: LocalStorageSettings;
  s3?: S3StorageSettings;
};
