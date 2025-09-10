import { ApiProperty } from "@nestjs/swagger";

export class AnalyticsSummaryResponseDto {
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
