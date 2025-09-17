import { ApiProperty } from "@nestjs/swagger";
import { ProductResponseModel } from "../models/product.models";

export class ProductResponseDto extends ProductResponseModel {
  @ApiProperty()
  declare id: string;

  @ApiProperty({ type: Object })
  declare slugs: Record<string, string>;

  @ApiProperty({ type: Object })
  declare translations: Record<string, Record<string, unknown>>;

  @ApiProperty()
  declare createdAt: Date;

  @ApiProperty()
  declare updatedAt: Date;

  constructor(partial: ProductResponseModel) {
    super();
    Object.assign(this, partial);
  }
}
