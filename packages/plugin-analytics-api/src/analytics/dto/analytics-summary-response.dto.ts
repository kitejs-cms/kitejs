import { ApiProperty } from "@nestjs/swagger";
import type { AnalyticsSummaryResponseModel } from "../models/analytics-summary-response.model";

export class AnalyticsSummaryResponseDto
  implements AnalyticsSummaryResponseModel
{
  @ApiProperty()
  totalEvents!: number;

  @ApiProperty()
  uniqueVisitors!: number;

  @ApiProperty({ type: Object })
  eventsByType!: Record<string, number>;

  constructor(partial: Partial<AnalyticsSummaryResponseDto>) {
    Object.assign(this, partial);
  }
}
