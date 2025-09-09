import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { TrackEventDto } from "./dto/track-event.dto";
import {
  AnalyticsEvent,
  AnalyticsEventDocument,
} from "./schemas/analytics-event.schema";
import { AnalyticsSettingsService } from "./analytics-settings.service";

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(AnalyticsEvent.name)
    private readonly eventModel: Model<AnalyticsEventDocument>,
    private readonly settingsService: AnalyticsSettingsService,
  ) {}

  async trackEvent(dto: TrackEventDto) {
    await this.eventModel.create(dto);
    const { retentionDays } = await this.settingsService.getSettings();
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    await this.eventModel.deleteMany({ createdAt: { $lt: cutoff } }).exec();
  }

  getEvents() {
    return this.eventModel.find().exec();
  }
}
