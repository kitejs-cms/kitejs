import { ApiProperty } from "@nestjs/swagger";
import type { AnalyticsAggregateResponseModel } from "../models/analytics-aggregate-response.model";

export class AnalyticsAggregateResponseDto
  implements AnalyticsAggregateResponseModel
{
  @ApiProperty()
  totalEvents!: number;

  @ApiProperty()
  uniqueVisitors!: number;

  @ApiProperty({ type: Object })
  eventsByIdentifier!: Record<string, number>;

  constructor(partial: Partial<AnalyticsAggregateResponseDto>) {
    Object.assign(this, partial);
  }
}
