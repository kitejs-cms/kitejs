import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Exclude, Type } from "class-transformer";
import type { ObjectId } from "mongoose";
import {
  IsArray,
  IsDate,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
} from "class-validator";

import type { CollectionTranslationModel } from "../models/collection-translation.model";
import type { CollectionResponseDetailslModel } from "../models/collection-response-details.model";
import { CollectionTranslationDto } from "./collection-traslation.dto";
import { CollectionStatus } from "../models/collection-status.enum";

export class CollectionResponseDetailsDto
  implements CollectionResponseDetailslModel
{
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ type: Object })
  @IsObject()
  translations: Record<string, CollectionTranslationModel>;

  @ApiProperty()
  @Type(() => Date)
  @IsDateString()
  createdAt: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDateString()
  updatedAt: string;

  @ApiProperty({
    description: "Identifier of the user who created the collection",
    example: "60f7bf5bd3a8f009e6f0b7d0",
  })
  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @ApiProperty({
    description: "Identifier of the user who last updated the collection",
    example: "60f7bf5bd3a8f009e6f0b7d0",
  })
  @IsString()
  @IsNotEmpty()
  updatedBy: string;

  @ApiProperty({
    description: "Tags associated with the collection",
    example: ["news", "sports"],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({
    description: "Status of the collection",
    example: CollectionStatus.Published,
    enum: CollectionStatus,
  })
  @IsString()
  @IsNotEmpty()
  status: CollectionStatus;

  @IsString()
  @IsMongoId()
  parent?: string;

  @ApiPropertyOptional({
    description: "Scheduled publish date (ISO string)",
    example: "2023-12-31T00:00:00.000Z",
  })
  @IsOptional()
  @IsDateString()
  publishAt?: string;

  @ApiPropertyOptional({
    description: "Expiration date (ISO string)",
    example: "2024-12-31T00:00:00.000Z",
  })
  @IsOptional()
  @IsDateString()
  @ValidateIf((o) => o.publishAt)
  expireAt?: string;

  @Exclude()
  _id: ObjectId;

  @Exclude()
  __v: number;

  constructor(partial: CollectionResponseDetailslModel) {
    Object.assign(this, partial);

    // Convert translations to DTO format
    const translations = Object.keys(partial.translations || {}).reduce(
      (acc, key) => {
        acc[key] = new CollectionTranslationDto(partial.translations[key]);
        return acc;
      },
      {} as Record<string, CollectionTranslationDto>
    );

    this.translations = translations;
  }
}
