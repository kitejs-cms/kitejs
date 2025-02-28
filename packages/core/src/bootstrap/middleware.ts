import { Response, NextFunction, Request } from "express";
import { INestApplication } from "@nestjs/common";
import { AuthMiddleware } from "../common";
import { AuthService } from "../modules/auth";

export async function middlewareSetup(app: INestApplication): Promise<void> {
  const cookieToHeaderMiddleware = new AuthMiddleware(app.get(AuthService));

  app.use((req: Request, res: Response, next: NextFunction) =>
    cookieToHeaderMiddleware.use(req, res, next)
  );
}
