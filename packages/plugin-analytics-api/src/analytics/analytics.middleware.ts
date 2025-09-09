import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import geoip from "geoip-lite";
import { AnalyticsService } from "./analytics.service";

@Injectable()
export class AnalyticsMiddleware implements NestMiddleware {
  constructor(private readonly analyticsService: AnalyticsService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    if (!req.path.includes("/web")) {
      return next();
    }

    const ageHeader = req.headers["x-user-age"];
    let age: number | undefined;
    if (Array.isArray(ageHeader)) {
      const parsed = parseInt(ageHeader[0], 10);
      age = isNaN(parsed) ? undefined : parsed;
    } else if (typeof ageHeader === "string") {
      const parsed = parseInt(ageHeader, 10);
      age = isNaN(parsed) ? undefined : parsed;
    }

    const segments = req.path.split("/").filter(Boolean);
    const webIndex = segments.indexOf("web");
    let resource: Record<string, any> | undefined;
    if (webIndex >= 0 && segments.length > webIndex + 1) {
      resource = {
        type: segments[webIndex + 1],
        id: segments[webIndex + 2],
      };
    }

    const ip =
      ((req.headers["x-forwarded-for"] as string) || "")
        .split(",")[0]
        .trim() ||
      req.socket.remoteAddress ||
      undefined;

    const lookup = ip ? geoip.lookup(ip) : undefined;
    const geo = lookup
      ? {
          country: lookup.country,
          region: lookup.region,
          city: lookup.city,
          ll: lookup.ll,
        }
      : undefined;

    let fingerprint: string | undefined;
    const ua = req.headers["user-agent"] as string | undefined;
    if (ip && ua) {
      fingerprint = createHash("sha256")
        .update(`${ip}-${ua}`)
        .digest("hex");
    }

    this.analyticsService.trackEvent({
      type: "request",
      payload: {
        path: req.path,
        method: req.method,
        resource,
      },
      userAgent: ua,
      origin: ip,
      age,
      ip,
      geo,
      fingerprint,
    });
    next();
  }
}
