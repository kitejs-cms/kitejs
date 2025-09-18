import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsObject, IsString } from "class-validator";

import type { ProductResponseModel } from "../models/product-response.model";

export class ProductResponseDto implements ProductResponseModel {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ type: Object })
  @IsObject()
  slugs: Record<string, string>;

  @ApiProperty({ type: Object })
  @IsObject()
  translations: Record<string, Record<string, unknown>>;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  createdAt: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  updatedAt: Date;

  constructor(partial: ProductResponseModel) {
    Object.assign(this, partial);
  }
}
