import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { TrackEventDto } from "./dto/track-event.dto";
import {
  AnalyticsEvent,
  AnalyticsEventDocument,
} from "./schemas/analytics-event.schema";

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(AnalyticsEvent.name)
    private readonly eventModel: Model<AnalyticsEventDocument>,
  ) {}

  async trackEvent(dto: TrackEventDto) {
    await this.eventModel.create(dto);
  }

  getEvents() {
    return this.eventModel.find().exec();
  }
}
