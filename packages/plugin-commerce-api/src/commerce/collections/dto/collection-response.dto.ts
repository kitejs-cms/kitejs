import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

import type { CollectionResponseModel } from "../models/collection-response.model";
import { CollectionStatus } from "../models/collection-status.enum";
import { CollectionSeoDto } from "./collection-seo.dto";

export class CollectionResponseDto implements CollectionResponseModel {
  @ApiProperty()
  @IsOptional()
  @IsMongoId()
  id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  language: string;

  @ApiProperty({ enum: CollectionStatus })
  @IsEnum(CollectionStatus)
  status: CollectionStatus;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: () => CollectionSeoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CollectionSeoDto)
  seo: CollectionSeoDto;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  publishAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expireAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string;

  constructor(partial: CollectionResponseModel) {
    Object.assign(this, partial);
  }
}
