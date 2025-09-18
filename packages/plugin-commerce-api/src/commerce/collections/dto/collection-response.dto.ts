import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsObject, IsString } from "class-validator";

import type { CollectionResponseModel } from "../models/collection-response.model";

export class CollectionResponseDto implements CollectionResponseModel {
  @ApiProperty()
  @IsString()
  declare id: string;

  @ApiProperty({ type: Object })
  @IsObject()
  declare slugs: Record<string, string>;

  @ApiProperty({ type: Object })
  @IsObject()
  declare translations: Record<string, Record<string, unknown>>;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  declare createdAt: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  declare updatedAt: Date;

  constructor(partial: CollectionResponseModel) {
    Object.assign(this, partial);
  }
}
