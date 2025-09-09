import { IsString, IsOptional, IsObject, IsNumber } from "class-validator";

export class TrackEventDto {
  @IsString()
  type!: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsString()
  origin?: string;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsObject()
  geo?: Record<string, any>;

  @IsOptional()
  @IsString()
  fingerprint?: string;
}
