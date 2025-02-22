import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication, Logger } from '@nestjs/common';
import {
  SettingsService,
  SWAGGER_SETTINGS_KEY,
  SwaggerSettingsModel,
} from '../modules/settings';

export async function swaggerSetup(
  app: INestApplication,
  settingsService: SettingsService,
  port: number
) {
  const logger = new Logger('SwaggerSetup');

  const dbConfig = (
    await settingsService.findOne<SwaggerSettingsModel>(
      'core',
      SWAGGER_SETTINGS_KEY
    )
  )?.value;

  const swaggerSettings = dbConfig ?? { ttl: 0, enabled: false };

  if (swaggerSettings?.enabled) {
    const config = new DocumentBuilder()
      .setTitle(swaggerSettings.title)
      .setDescription(swaggerSettings.description)
      .setVersion(swaggerSettings.version)
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(swaggerSettings.path, app, document);

    logger.log(
      `📄 Swagger documentation available at: http://localhost:${port}/${swaggerSettings.path}`
    );
  } else {
    logger.warn('⚠️ Swagger is disabled.');
  }
}
