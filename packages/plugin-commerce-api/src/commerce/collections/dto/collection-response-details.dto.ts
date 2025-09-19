import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsObject, IsString } from "class-validator";

import type { CollectionTranslationModel } from "../models/collection-translation.model";
import type { CollectionResponseDetailslModel } from "../models/collection-response-details.model";

export class CollectionResponseDetailsDto
  implements CollectionResponseDetailslModel
{
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ type: Object })
  @IsObject()
  slugs: Record<string, string>;

  @ApiProperty({ type: Object })
  @IsObject()
  translations: Record<string, CollectionTranslationModel>;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  createdAt: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  updatedAt: Date;

  constructor(partial: CollectionResponseDetailslModel) {
    Object.assign(this, partial);
  }
}
