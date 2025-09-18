import { ApiProperty } from "@nestjs/swagger";
import type { CollectionResponseModel } from "../models/collection.models";

export class CollectionResponseDto implements CollectionResponseModel {
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
    Object.assign(this, partial);
  }
}
