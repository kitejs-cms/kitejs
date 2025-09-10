import {
  IsString,
  IsOptional,
  IsObject,
  IsNumber,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import type { TrackEventModel } from "../models/track-event.model";

export class TrackEventDto implements TrackEventModel {
  @ApiProperty()
  @IsString()
  type!: string;

  @ApiProperty({ type: Object, required: false })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  identifier?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  duration?: number;
}

export type TrackEvent = TrackEventModel & {
  userAgent?: string;
  ip?: string;
  geo?: Record<string, any>;
  fingerprint?: string;
  browser?: string;
  os?: string;
  device?: string;
  country?: string;
  region?: string;
  city?: string;
};
