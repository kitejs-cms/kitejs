import { ConsoleLogger, Logger, Type } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { CoreModule } from "../core.module";
import { ConfigService } from "@nestjs/config";
import { SettingsService } from "../modules/settings";
import { swaggerSetup } from "./swagger";
import { validationSetup } from "./validation";
import { securitySetup } from "./security";
import cookieParser from "cookie-parser";
import { IPlugin } from "../modules/plugins";
import { pluginsSetup } from "./plugins";
import { middlewareSetup } from "./middleware";
import { staticSetup } from "./static";

interface BootstrapOptions {
  modules?: Type<unknown>[];
  plugins?: IPlugin[];
}

export async function bootstrap({
  modules = [],
  plugins = [],
}: BootstrapOptions): Promise<void> {
  const pluginsModules = await pluginsSetup(plugins);

  const logger = new ConsoleLogger({ prefix: "KiteJs" });

  const app = await NestFactory.create(
    CoreModule.register([...modules, ...pluginsModules]),
    { logger }
  );

  const configService = app.get(ConfigService);
  const settingsService = app.get(SettingsService);

  const port = configService.get<number>("PORT") || 3000;

  app.use(cookieParser());
  await swaggerSetup(app, settingsService, port);
  await middlewareSetup(app);
  await staticSetup(app, settingsService);
  securitySetup(app);
  validationSetup(app);

  await app.listen(port);

  Logger.log(`🚀 Application is running on: http://localhost:${port}`);
}
