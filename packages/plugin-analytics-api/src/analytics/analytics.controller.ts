import { Body, Controller, Get, Post } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsSettingsService } from "./analytics-settings.service";
import { TrackEventDto } from "./dto/track-event.dto";

@Controller("analytics")
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly settingsService: AnalyticsSettingsService
  ) {}

  @Post("events")
  async track(@Body() dto: TrackEventDto) {
    await this.analyticsService.trackEvent(dto);
    return { status: "ok" };
  }

  @Get("events")
  list() {
    return this.analyticsService.getEvents();
  }

  @Get("settings")
  getSettings() {
    return this.settingsService.getSettings();
  }
}
