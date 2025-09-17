import { ApiProperty } from "@nestjs/swagger";
import { CollectionResponseModel } from "../models/collection.models";

export class CollectionResponseDto extends CollectionResponseModel {
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

  constructor(partial: CollectionResponseModel) {
    super();
    Object.assign(this, partial);
  }
}
