import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import geoip from "geoip-lite";
import UAParser from "ua-parser-js";
import { createHash } from "crypto";
import { AnalyticsService } from "./analytics.service";
import { TrackEventDto } from "./dto/track-event.dto";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post("events")
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

    const event: TrackEventDto = {
      ...dto,
      userAgent,
      origin: (req.headers.origin as string) || dto.origin,
      age: req.headers["x-user-age"]
        ? Number(req.headers["x-user-age"])
        : dto.age,
      ip,
      geo: geo || dto.geo,
      fingerprint: fingerprint || dto.fingerprint,
      browser: ua?.browser.name,
      os: ua?.os.name,
      device: ua?.device.type,
    };

    await this.analyticsService.trackEvent(event);
    return { status: "ok" };
  }
}
