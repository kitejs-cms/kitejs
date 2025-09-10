import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import geoip from "geoip-lite";
import UAParser from "ua-parser-js";
import { createHash } from "crypto";
import { AnalyticsService } from "./analytics.service";
import { TrackEventDto, TrackEvent } from "./dto/track-event.dto";
import { AnalyticsEventResponseDto } from "./dto/analytics-event-response.dto";
import { AnalyticsSummaryResponseDto } from "./dto/analytics-summary-response.dto";
import { AnalyticsAggregateResponseDto } from "./dto/analytics-aggregate-response.dto";
import { AnalyticsApiKeyGuard } from "./guards/api-key.guard";
import {
  JwtAuthGuard,
  PermissionsGuard,
  Permissions,
  ApiPagination,
  ApiSort,
  parseQuery,
  createMetaModel,
} from "@kitejs-cms/core";
import {
  ANALYTICS_PLUGIN_NAMESPACE,
} from "../constants";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from "@nestjs/swagger";

@ApiTags("Analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post("events")
  @ApiOperation({ summary: "Track analytics event" })
  @ApiResponse({ status: 201, description: "Event tracked" })
  @UseGuards(AnalyticsApiKeyGuard)
  async track(@Body() dto: TrackEventDto, @Req() req: Request) {
    const ip = ((req.headers["x-forwarded-for"] as string) || req.ip || "")
      .split(",")[0]
      .trim();
    const userAgent = req.headers["user-agent"] as string | undefined;
    const ua = userAgent ? new UAParser(userAgent).getResult() : undefined;
    const geo = ip ? (geoip.lookup(ip) ?? undefined) : undefined;
    const fingerprint =
      userAgent && ip
        ? createHash("sha256").update(`${ip}-${userAgent}`).digest("hex")
        : undefined;

    const event: TrackEvent = {
      ...dto,
      userAgent,
      origin: (req.headers.origin as string) || dto.origin,
      ip,
      geo,
      fingerprint,
      browser: ua?.browser.name,
      os: ua?.os.name,
      device: ua?.device.type,
      country: geo?.country,
      region: geo?.region,
      city: geo?.city,
    };

    await this.analyticsService.trackEvent(event);
    return { status: "ok" };
  }

  @Get("events")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(`${ANALYTICS_PLUGIN_NAMESPACE}:events.read`)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Retrieve paginated analytics events" })
  @ApiResponse({
    status: 200,
    description: "List of analytics events",
    type: [AnalyticsEventResponseDto],
  })
  @ApiPagination()
  @ApiSort(["createdAt"])
  @ApiQuery({ name: "type", required: false, type: String })
  @ApiQuery({ name: "identifier", required: false, type: String })
  @ApiQuery({ name: "startDate", required: false, type: String })
  @ApiQuery({ name: "endDate", required: false, type: String })
  async getEvents(@Query() query: Record<string, string>) {
    const { filter, sort, skip, take } = parseQuery(query, {
      allowedFilters: ["type", "identifier"],
    });
    const typedFilter = filter as {
      type?: string;
      identifier?: string;
      createdAt?: Record<string, Date>;
    };
    const { startDate, endDate } = query;
    if (startDate || endDate) {
      typedFilter.createdAt = {};
      if (startDate) typedFilter.createdAt.$gte = new Date(startDate);
      if (endDate) typedFilter.createdAt.$lte = new Date(endDate);
    }
    const totalItems = await this.analyticsService.countEvents(typedFilter);
    const events = await this.analyticsService.findEvents(
      skip,
      take,
      sort,
      typedFilter
    );
    return {
      meta: createMetaModel({ filter, sort, skip, take }, totalItems),
      data: events.map((e) => new AnalyticsEventResponseDto(e)),
    };
  }

  @Get("events/summary")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(`${ANALYTICS_PLUGIN_NAMESPACE}:summary.read`)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Retrieve analytics event summary" })
  @ApiResponse({
    status: 200,
    description: "Analytics events summary",
    type: AnalyticsSummaryResponseDto,
  })
  @ApiQuery({ name: "type", required: false, type: String })
  @ApiQuery({ name: "identifier", required: false, type: String })
  @ApiQuery({ name: "startDate", required: false, type: String })
  @ApiQuery({ name: "endDate", required: false, type: String })
  async getSummary(@Query() query: Record<string, string>) {
    const { filter } = parseQuery(query, {
      allowedFilters: ["type", "identifier"],
    });
    const typedFilter = filter as {
      type?: string;
      identifier?: string;
      createdAt?: Record<string, Date>;
    };
    const { startDate, endDate } = query;
    if (startDate || endDate) {
      typedFilter.createdAt = {};
      if (startDate) typedFilter.createdAt.$gte = new Date(startDate);
      if (endDate) typedFilter.createdAt.$lte = new Date(endDate);
    }
    const summary = await this.analyticsService.getEventSummary(typedFilter);
    return new AnalyticsSummaryResponseDto(summary);
  }

  @Get("events/aggregate")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(`${ANALYTICS_PLUGIN_NAMESPACE}:events.read`)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Aggregate analytics events" })
  @ApiResponse({
    status: 200,
    description: "Aggregated analytics events",
    type: AnalyticsAggregateResponseDto,
  })
  @ApiQuery({ name: "type", required: false, type: String })
  @ApiQuery({ name: "identifier", required: false, type: String })
  @ApiQuery({ name: "startDate", required: false, type: String })
  @ApiQuery({ name: "endDate", required: false, type: String })
  async aggregate(@Query() query: Record<string, string>) {
    const { filter } = parseQuery(query, {
      allowedFilters: ["type", "identifier"],
    });
    const typedFilter = filter as {
      type?: string;
      identifier?: string;
      createdAt?: Record<string, Date>;
    };
    const { startDate, endDate } = query;
    if (startDate || endDate) {
      typedFilter.createdAt = {};
      if (startDate) typedFilter.createdAt.$gte = new Date(startDate);
      if (endDate) typedFilter.createdAt.$lte = new Date(endDate);
    }
    const result = await this.analyticsService.aggregateEvents(typedFilter);
    return new AnalyticsAggregateResponseDto(result);
  }
}
