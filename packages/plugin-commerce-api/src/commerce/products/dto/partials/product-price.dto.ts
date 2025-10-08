import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import type { ProductPriceModel } from "../../models/partials/product-price.model";

export class ProductPriceDto implements ProductPriceModel {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  currencyCode: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  compareAtAmount?: number;

  constructor(partial: ProductPriceModel) {
    Object.assign(this, partial);
  }
}
