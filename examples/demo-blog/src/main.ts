import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { getEnabledPlugins } from "@kitejs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
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

  const config = new DocumentBuilder()
    .setTitle("CMS API")
    .setDescription("API documentation for the CMS")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api-docs", app, document);

  app.setGlobalPrefix("api", { exclude: [""] });
  await app.init();

  const configService = app.get(ConfigService);
  const plugins = getEnabledPlugins(configService.get("plugins") || []);
  console.log("Enabled Plugins:", plugins);

  const port = configService.get<number>("app.port") || 3000;
  server.listen(port, () => {
    console.log(`🚀 Application is running on http://localhost:${port}`);
    console.log(
      `📄 Swagger documentation is available at: http://localhost:${port}/api-docs`
    );
  });
}

bootstrap();
