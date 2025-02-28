import { NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { AuthService } from "../../modules/auth";

export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const { cookieName = "session" } = await this.authService.getAuthConfig();

    const token = req.cookies?.[cookieName] || null;

    if (token) {
      const json = JSON.parse(token);

      if (json && json.accessToken)
        req.headers.authorization = `Bearer ${json.accessToken}`;
    }

    next();
  }
}
