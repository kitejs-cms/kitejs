import { ApiProperty } from "@nestjs/swagger";
import type { AnalyticsLocationsResponseModel } from "../models/analytics-locations-response.model";

export class AnalyticsLocationsResponseDto
  implements AnalyticsLocationsResponseModel
{
  @ApiProperty({ type: Object, required: false })
  countries?: Record<string, number>;

  @ApiProperty({ type: Object, required: false })
  cities?: Record<string, number>;

  constructor(partial: Partial<AnalyticsLocationsResponseDto>) {
    Object.assign(this, partial);
  }
}
