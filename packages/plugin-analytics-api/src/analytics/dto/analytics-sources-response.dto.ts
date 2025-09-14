import { ApiProperty } from "@nestjs/swagger";
import type { AnalyticsSourcesResponseModel } from "../models/analytics-sources-response.model";

export class AnalyticsSourcesResponseDto implements AnalyticsSourcesResponseModel {
  @ApiProperty({ type: Object })
  sources!: Record<string, number>;

  constructor(partial: Partial<AnalyticsSourcesResponseDto>) {
    Object.assign(this, partial);
  }
}
