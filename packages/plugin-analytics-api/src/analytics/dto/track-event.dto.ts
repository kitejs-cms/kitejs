import {
  IsString,
  IsOptional,
  IsObject,
  IsNumber,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class TrackEventDto {
  @ApiProperty()
  @IsString()
  type!: string;

  @ApiProperty({ type: Object, required: false })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  origin?: string;

}

export type TrackEvent = TrackEventDto & {
  userAgent?: string;
  ip?: string;
  geo?: Record<string, any>;
  fingerprint?: string;
  browser?: string;
  os?: string;
  device?: string;
};
