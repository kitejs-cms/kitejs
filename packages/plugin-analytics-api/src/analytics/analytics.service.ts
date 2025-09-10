import { BadRequestException, Injectable, OnModuleInit } from "@nestjs/common";
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

  async countEvents(
    filter: { type?: string; createdAt?: Record<string, Date> } = {}
  ): Promise<number> {
    try {
      return await this.eventModel.countDocuments(filter).exec();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to count events. ${message}`);
    }
  }

  async findEvents(
    skip = 0,
    take = 10,
    sort: Record<string, 1 | -1> = { createdAt: -1 },
    filter: { type?: string; createdAt?: Record<string, Date> } = {}
  ): Promise<AnalyticsEventDocument[]> {
    try {
      return this.eventModel
        .find(filter)
        .skip(skip)
        .limit(take)
        .sort(sort)
        .exec();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to retrieve events. ${message}`);
    }
  }

  async getEventSummary(
    filter: { type?: string; createdAt?: Record<string, Date> } = {}
  ): Promise<{
    totalEvents: number;
    uniqueVisitors: number;
    eventsByType: Record<string, number>;
  }> {
    try {
      const match = filter;
      const totalEvents = await this.eventModel.countDocuments(match).exec();
      const uniqueVisitors = (
        await this.eventModel.distinct("fingerprint", match).exec()
      ).length;
      const eventsByTypeAgg = await this.eventModel
        .aggregate<{
          _id: string;
          count: number;
        }>([
          { $match: match },
          { $group: { _id: "$type", count: { $sum: 1 } } },
        ])
        .exec();
      const eventsByType: Record<string, number> = {};
      for (const { _id, count } of eventsByTypeAgg) {
        eventsByType[_id] = count;
      }
      return { totalEvents, uniqueVisitors, eventsByType };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to aggregate events. ${message}`);
    }
  }
}
