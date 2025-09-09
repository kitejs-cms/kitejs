import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { AnalyticsService } from "./analytics.service";

@Injectable()
export class AnalyticsMiddleware implements NestMiddleware {
  constructor(private readonly analyticsService: AnalyticsService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    const ageHeader = req.headers["x-user-age"];
    let age: number | undefined;
    if (Array.isArray(ageHeader)) {
      const parsed = parseInt(ageHeader[0], 10);
      age = isNaN(parsed) ? undefined : parsed;
    } else if (typeof ageHeader === "string") {
      const parsed = parseInt(ageHeader, 10);
      age = isNaN(parsed) ? undefined : parsed;
    }

    this.analyticsService.trackEvent({
      type: "request",
      payload: {
        path: req.path,
        method: req.method,
      },
      userAgent: req.headers["user-agent"] as string,
      origin:
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress ||
        undefined,
      age,
    });
    next();
  }
}
