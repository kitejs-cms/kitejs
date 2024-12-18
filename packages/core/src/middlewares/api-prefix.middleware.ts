import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class ApiPrefixMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.path.startsWith("/assets")) {
      return next();
    }

    if (!req.path.startsWith("/api")) {
      req.url = `/api${req.url}`;
    }

    next();
  }
}
