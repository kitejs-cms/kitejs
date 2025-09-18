import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString } from "class-validator";

import type { CollectionSeoModel } from "../models/collection-seo.model";

export class CollectionSeoDto implements CollectionSeoModel {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare metaTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare metaDescription?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  declare metaKeywords?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare canonicalUrl?: string;
}
