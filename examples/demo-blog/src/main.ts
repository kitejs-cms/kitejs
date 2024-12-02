import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { getEnabledPlugins } from "@kitejs/core";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configura pipe di validazione
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Usa il ConfigService per ottenere i plugin e la porta
  const configService = app.get(ConfigService);
  const plugins = getEnabledPlugins(configService.get("plugins") || []);
  //console.log("Enabled Plugins:", plugins);

  const port = configService.get<number>("app.port") || 3000;
  await app.listen(port);
  console.log(`Application is running on http://localhost:${port}`);
}
bootstrap();
