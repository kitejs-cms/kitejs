import { Injectable } from "@nestjs/common";
import { SettingsService } from "@kitejs-cms/core";
import { randomUUID } from "crypto";
import {
  ANALYTICS_PLUGIN_NAMESPACE,
  ANALYTICS_SETTINGS_KEY,
  DEFAULT_RETENTION_DAYS,
  type AnalyticsPluginSettingsModel,
} from "../constants";

@Injectable()
export class AnalyticsSettingsService {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Retrieves analytics settings, generating a new API key if missing.
   */
  async getSettings(): Promise<AnalyticsPluginSettingsModel> {
    const setting = await this.settingsService.findOne<AnalyticsPluginSettingsModel>(
      ANALYTICS_PLUGIN_NAMESPACE,
      ANALYTICS_SETTINGS_KEY
    );

    if (setting?.value?.apiKey) {
      const value = {
        apiKey: setting.value.apiKey,
        retentionDays:
          setting.value.retentionDays ?? DEFAULT_RETENTION_DAYS,
      };
      if (value.retentionDays !== setting.value.retentionDays) {
        await this.settingsService.upsert(
          ANALYTICS_PLUGIN_NAMESPACE,
          ANALYTICS_SETTINGS_KEY,
          value
        );
      }
      return value;
    }

    const value: AnalyticsPluginSettingsModel = {
      apiKey: randomUUID(),
      retentionDays: DEFAULT_RETENTION_DAYS,
    };
    await this.settingsService.upsert(
      ANALYTICS_PLUGIN_NAMESPACE,
      ANALYTICS_SETTINGS_KEY,
      value
    );
    return value;
  }
}
