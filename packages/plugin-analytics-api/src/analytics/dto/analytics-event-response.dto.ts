import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import type { ObjectId } from "mongoose";
import type { AnalyticsEventDocument } from "../schemas/analytics-event.schema";

export class AnalyticsEventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty({ type: Object, required: false })
  payload?: Record<string, any>;

  @ApiProperty({ required: false })
  userAgent?: string;

  @ApiProperty({ required: false })
  origin?: string;

  @ApiProperty({ required: false })
  identifier?: string;

  @ApiProperty({ required: false })
  duration?: number;

  @ApiProperty({ required: false })
  ip?: string;

  @ApiProperty({ type: Object, required: false })
  geo?: Record<string, any>;

  @ApiProperty({ required: false })
  fingerprint?: string;

  @ApiProperty({ required: false })
  browser?: string;

  @ApiProperty({ required: false })
  os?: string;

  @ApiProperty({ required: false })
  device?: string;

  @ApiProperty({ required: false })
  country?: string;

  @ApiProperty({ required: false })
  region?: string;

  @ApiProperty({ required: false })
  city?: string;

  @ApiProperty()
  createdAt: Date;

  @Exclude()
  _id: ObjectId;

  @Exclude()
  __v: number;

  constructor(event: AnalyticsEventDocument) {
    Object.assign(this, event.toObject());
    this.id = event._id.toString();
  }
}
