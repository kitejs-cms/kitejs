import { Body, Controller, Get, Post } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { TrackEventDto } from "./dto/track-event.dto";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post("events")
  async track(@Body() dto: TrackEventDto) {
    await this.analyticsService.trackEvent(dto);
    return { status: "ok" };
  }

  @Get("events")
  list() {
    return this.analyticsService.getEvents();
  }
}
