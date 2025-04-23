import { INestApplication, Logger } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import {
  SettingsService,
  STORAGE_SETTINGS_KEY,
  StorageSettingsModel,
} from "../modules/settings";

export async function staticSetup(
  app: INestApplication,
  settingsService: SettingsService
) {
  const logger = new Logger("StaticSetup");

  const stored = await settingsService.findOne<StorageSettingsModel>(
    "core",
    STORAGE_SETTINGS_KEY
  );
  const config = stored?.value;
  if (!config) {
    logger.warn(
      `No storage settings found under key "${STORAGE_SETTINGS_KEY}", skipping static setup`
    );
    return;
  }

  const expressApp = app as NestExpressApplication;

  if (config.provider === "local" && config.local) {
    expressApp.useStaticAssets(config.local.uploadPath, {
      prefix: "/public",
      index: false,
    });
    logger.log(
      `Serving local static assets from ${config.local.uploadPath} at /uploads`
    );
  } else if (config.provider === "s3" && config.s3) {
    logger.log(
      `S3 storage configured (bucket: ${config.s3.bucket}). ` +
        `Configure your controllers to return S3 URLs directly.`
    );
  } else {
    logger.warn(
      `Invalid storage settings: provider=${config.provider}, ` +
        `local=${!!config.local}, s3=${!!config.s3}`
    );
  }
}
