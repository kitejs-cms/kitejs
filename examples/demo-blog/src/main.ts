import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { getEnabledPlugins } from "@kitejs/core";
import { createServer } from "http";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const server = createServer(app.getHttpAdapter().getInstance());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  app.setGlobalPrefix("api", { exclude: [""] });
  await app.init();

  const configService = app.get(ConfigService);
  const plugins = getEnabledPlugins(configService.get("plugins") || []);
  console.log("Enabled Plugins:", plugins);

  const port = configService.get<number>("app.port") || 3000;
  server.listen(port, () => {
    console.log(`Application is running on http://localhost:${port}`);
  });
}

bootstrap();
