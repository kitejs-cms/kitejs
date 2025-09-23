import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString } from "class-validator";

import type { CollectionSeoModel } from "../models/collection-seo.model";

export class CollectionSeoDto implements CollectionSeoModel {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metaKeywords?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  canonical?: string;

  constructor(partial: CollectionSeoModel) {
    Object.assign(this, partial);
  }
}
