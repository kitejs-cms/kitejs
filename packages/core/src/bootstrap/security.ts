import helmet from "helmet";
import { INestApplication } from "@nestjs/common";

export async function securitySetup(
  app: INestApplication,
  cors: string[]
): Promise<void> {
  app.use(helmet());

  console.log(cors);

  app.enableCors({
    origin: cors,
    credentials: true,
  });
}
