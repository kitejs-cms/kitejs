import { ApiProperty } from "@nestjs/swagger";

import type { ProductResponseModel } from "../models/product-response.model";

export class ProductResponseDto implements ProductResponseModel {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: Object })
  slugs: Record<string, string>;

  @ApiProperty({ type: Object })
  translations: Record<string, Record<string, unknown>>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: ProductResponseModel) {
    Object.assign(this, partial);
  }
}
