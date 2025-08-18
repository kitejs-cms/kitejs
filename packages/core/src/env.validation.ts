import { plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString, validateSync } from "class-validator";

class EnvironmentVariables {
  @IsNumber()
  @IsOptional()
  API_PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  API_DB_URL!: string;

  @IsString()
  @IsNotEmpty()
  API_SECRET!: string;

  @IsString()
  @IsOptional()
  API_CORS: string = "http://localhost:5173";
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
