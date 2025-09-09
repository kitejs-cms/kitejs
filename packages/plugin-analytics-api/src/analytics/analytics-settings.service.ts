import { Injectable } from "@nestjs/common";
import { SettingsService } from "@kitejs-cms/core";
import { randomUUID } from "crypto";
import {
  ANALYTICS_PLUGIN_NAMESPACE,
  ANALYTICS_SETTINGS_KEY,
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
      return setting.value;
    }

    const value = { apiKey: randomUUID() };
    await this.settingsService.upsert(
      ANALYTICS_PLUGIN_NAMESPACE,
      ANALYTICS_SETTINGS_KEY,
      value
    );
    return value;
  }
}
