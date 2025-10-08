import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsArray, IsNumber } from "class-validator";
import { ProductOptionModel } from "../../models/partials/product-option.model";

export class ProductOptionDto implements ProductOptionModel {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  displayName: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  values: string[];

  @ApiProperty()
  @IsNumber()
  position: number;

  constructor(partial: ProductOptionModel) {
    Object.assign(this, partial);
  }
}
