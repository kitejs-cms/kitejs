import helmet from 'helmet';
import { INestApplication } from '@nestjs/common';

export async function securitySetup(app: INestApplication): Promise<void> {
  app.use(helmet());

  app.enableCors({
    origin: '*',
    credentials: true,
  });
}
