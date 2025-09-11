import { ApiProperty } from "@nestjs/swagger";
import type { AnalyticsTechnologiesResponseModel } from "../models/analytics-technologies-response.model";

export class AnalyticsTechnologiesResponseDto implements AnalyticsTechnologiesResponseModel {
  @ApiProperty({ type: Object })
  browsers!: Record<string, number>;

  @ApiProperty({ type: Object })
  os!: Record<string, number>;

  @ApiProperty({ type: Object })
  devices!: Record<string, number>;

  constructor(partial: Partial<AnalyticsTechnologiesResponseDto>) {
    Object.assign(this, partial);
  }
}
