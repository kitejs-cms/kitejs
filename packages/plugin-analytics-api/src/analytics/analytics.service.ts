import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { TrackEvent } from "./dto/track-event.dto";
import {
  AnalyticsEvent,
  AnalyticsEventDocument,
} from "./schemas/analytics-event.schema";
import { SettingsService } from "@kitejs-cms/core";
import {
  ANALYTICS_PLUGIN_NAMESPACE,
  ANALYTICS_SETTINGS_KEY,
  DEFAULT_RETENTION_DAYS,
} from "../constants";
import { AnalyticsPluginSettingsModel } from "./models/analytics-plugin-settings.model";

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(AnalyticsEvent.name)
    private readonly eventModel: Model<AnalyticsEventDocument>,
    private readonly settingsService: SettingsService
  ) {}

  async trackEvent(dto: TrackEvent) {
    if (dto.identifier) {
      const query: Record<string, any> = {
        type: dto.type,
        identifier: dto.identifier,
      };
      if (dto.fingerprint) query.fingerprint = dto.fingerprint;
      await this.eventModel
        .findOneAndUpdate(query, dto, {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        })
        .exec();
    } else {
      await this.eventModel.create(dto);
    }
    const { value } =
      await this.settingsService.findOne<AnalyticsPluginSettingsModel>(
        ANALYTICS_PLUGIN_NAMESPACE,
        ANALYTICS_SETTINGS_KEY
      );

    const retentionDays = value?.retentionDays ?? DEFAULT_RETENTION_DAYS;
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    await this.eventModel.deleteMany({ createdAt: { $lt: cutoff } }).exec();
  }

  async countEvents(
    filter: {
      type?: string;
      identifier?: string;
      createdAt?: Record<string, Date>;
    } = {}
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
    filter: {
      type?: string;
      identifier?: string;
      createdAt?: Record<string, Date>;
    } = {}
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
    filter: {
      type?: string;
      identifier?: string;
      createdAt?: Record<string, Date>;
    } = {}
  ): Promise<{
    totalEvents: number;
    uniqueVisitors: number;
    newUsers: number;
    eventsByType: Record<string, number>;
  }> {
    try {
      const match = filter;
      const totalEvents = await this.eventModel.countDocuments(match).exec();
      const uniqueVisitors = (
        await this.eventModel.distinct("fingerprint", match).exec()
      ).length;

      // calculate new users within the provided date range
      let newUsers = 0;
      const rangeStart = match.createdAt?.$gte;
      const rangeEnd = match.createdAt?.$lte;
      if (rangeStart || rangeEnd) {
        const globalMatch = { ...match } as Record<string, any>;
        delete globalMatch.createdAt;
        const newUsersAgg = await this.eventModel
          .aggregate<{
            _id: string;
            firstEvent: Date;
          }>([
            { $match: globalMatch },
            {
              $group: {
                _id: "$fingerprint",
                firstEvent: { $min: "$createdAt" },
              },
            },
            {
              $match: {
                firstEvent: {
                  ...(rangeStart ? { $gte: rangeStart } : {}),
                  ...(rangeEnd ? { $lte: rangeEnd } : {}),
                },
              },
            },
          ])
          .exec();
        newUsers = newUsersAgg.length;
      }

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
      return { totalEvents, uniqueVisitors, newUsers, eventsByType };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to aggregate events. ${message}`);
    }
  }
  async aggregateEvents(
    filter: {
      type?: string;
      identifier?: string;
      createdAt?: Record<string, Date>;
    } = {}
  ): Promise<{
    totalEvents: number;
    uniqueVisitors: number;
    eventsByIdentifier: Record<string, { count: number; duration?: number }>;
    eventsByType: Record<
      string,
      {
        count: number;
        duration?: number;
        identifiers: Record<string, { count: number; duration?: number }>;
      }
    >;
  }> {
    try {
      const match = filter;
      const totalEvents = await this.eventModel.countDocuments(match).exec();
      const uniqueVisitors = (
        await this.eventModel.distinct("fingerprint", match).exec()
      ).length;
      const eventsByIdentifierAgg = await this.eventModel
        .aggregate<{
          _id: string;
          count: number;
          duration: number | null;
        }>([
          { $match: match },
          {
            $group: {
              _id: "$identifier",
              count: { $sum: 1 },
              duration: { $avg: "$duration" },
            },
          },
        ])
        .exec();
      const eventsByTypeAgg = await this.eventModel
        .aggregate<{
          _id: string;
          count: number;
          duration: number | null;
        }>([
          { $match: match },
          {
            $group: {
              _id: "$type",
              count: { $sum: 1 },
              duration: { $avg: "$duration" },
            },
          },
        ])
        .exec();
      const eventsByTypeIdentifierAgg = await this.eventModel
        .aggregate<{
          _id: { type: string; identifier: string };
          count: number;
          duration: number | null;
        }>([
          { $match: match },
          {
            $group: {
              _id: { type: "$type", identifier: "$identifier" },
              count: { $sum: 1 },
              duration: { $avg: "$duration" },
            },
          },
        ])
        .exec();
      const eventsByIdentifier: Record<
        string,
        { count: number; duration?: number }
      > = {};
      for (const { _id, count, duration } of eventsByIdentifierAgg) {
        if (_id)
          eventsByIdentifier[_id] = {
            count,
            ...(duration != null ? { duration: +duration.toFixed(2) } : {}),
          };
      }
      const eventsByType: Record<
        string,
        {
          count: number;
          duration?: number;
          identifiers: Record<string, { count: number; duration?: number }>;
        }
      > = {};
      for (const { _id, count, duration } of eventsByTypeAgg) {
        if (_id)
          eventsByType[_id] = {
            count,
            ...(duration != null ? { duration: +duration.toFixed(2) } : {}),
            identifiers: {},
          };
      }
      for (const {
        _id: { type, identifier },
        count,
        duration,
      } of eventsByTypeIdentifierAgg) {
        if (type && identifier) {
          if (!eventsByType[type]) {
            eventsByType[type] = { count: 0, identifiers: {} };
          }
          eventsByType[type].identifiers[identifier] = {
            count,
            ...(duration != null ? { duration: +duration.toFixed(2) } : {}),
          };
        }
      }
      return { totalEvents, uniqueVisitors, eventsByIdentifier, eventsByType };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to aggregate events. ${message}`);
    }
  }

  async getTechnologies(
    filter: {
      type?: string;
      identifier?: string;
      createdAt?: Record<string, Date>;
    } = {}
  ): Promise<{
    browsers: Record<string, number>;
    os: Record<string, number>;
    devices: Record<string, number>;
  }> {
    try {
      const match = filter;
      const aggregateField = (field: string) =>
        this.eventModel
          .aggregate<{
            _id: string;
            count: number;
          }>([
            { $match: match },
            { $group: { _id: `$${field}`, count: { $sum: 1 } } },
          ])
          .exec();

      const [browsersAgg, osAgg, devicesAgg] = await Promise.all([
        aggregateField("browser"),
        aggregateField("os"),
        aggregateField("device"),
      ]);

      const browsers: Record<string, number> = {};
      for (const { _id, count } of browsersAgg) {
        if (_id) browsers[_id] = count;
      }

      const os: Record<string, number> = {};
      for (const { _id, count } of osAgg) {
        if (_id) os[_id] = count;
      }

      const devices: Record<string, number> = {};
      for (const { _id, count } of devicesAgg) {
        if (_id) devices[_id] = count;
      }

      return { browsers, os, devices };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to aggregate technologies. ${message}`
      );
    }
  }

  async getLocations(
    filter: {
      type?: string;
      identifier?: string;
      createdAt?: Record<string, Date>;
    } = {},
    country?: string
  ): Promise<{ countries?: Record<string, number>; cities?: Record<string, number> }> {
    try {
      const match = { ...filter } as Record<string, any>;
      if (country) {
        match.country = country;
      }
      const field = country ? "city" : "country";
      const agg = await this.eventModel
        .aggregate<{ _id: string; count: number }>([
          { $match: match },
          { $group: { _id: `$${field}`, count: { $sum: 1 } } },
        ])
        .exec();
      const result: Record<string, number> = {};
      for (const { _id, count } of agg) {
        if (_id) result[_id] = count;
      }
      return country ? { cities: result } : { countries: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to aggregate locations. ${message}`);
    }
  }
}
