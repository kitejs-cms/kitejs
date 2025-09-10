import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { TrackEventDto } from "./dto/track-event.dto";
import {
  AnalyticsEvent,
  AnalyticsEventDocument,
} from "./schemas/analytics-event.schema";
import { SettingsService } from "@kitejs-cms/core";
import {
  ANALYTICS_PLUGIN_NAMESPACE,
  ANALYTICS_SETTINGS_KEY,
} from "../constants";
import { AnalyticsPluginSettingsModel } from "./models/analytics-plugin-settings.model";

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(AnalyticsEvent.name)
    private readonly eventModel: Model<AnalyticsEventDocument>,
    private readonly settingsService: SettingsService
  ) {}

  async trackEvent(dto: TrackEventDto) {
    await this.eventModel.create(dto);
    const { value } =
      await this.settingsService.findOne<AnalyticsPluginSettingsModel>(
        ANALYTICS_PLUGIN_NAMESPACE,
        ANALYTICS_SETTINGS_KEY
      );

    const retentionDays = value?.retentionDays ?? 90;
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    await this.eventModel.deleteMany({ createdAt: { $lt: cutoff } }).exec();
  }
}
