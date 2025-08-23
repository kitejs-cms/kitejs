import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString } from "class-validator";
import { GallerySeoModel } from "../models/gallery-seo.model";

export class GallerySeoDto implements GallerySeoModel {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaTitle: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaDescription: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metaKeywords?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  canonical?: string;

  constructor(partial: Partial<GallerySeoDto>) {
    Object.assign(this, partial);
  }
}
