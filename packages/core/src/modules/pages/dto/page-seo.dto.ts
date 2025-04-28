import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString } from "class-validator";
import { PageSeoModel } from "../models/page-seo.model";

export class PageSeoDto implements PageSeoModel {
  @ApiProperty({
    description: "Meta title for SEO",
    example: "Page SEO Title",
  })
  @IsString()
  @IsOptional()
  metaTitle: string;

  @ApiProperty({
    description: "Meta description for SEO",
    example: "This is the SEO description for the page",
  })
  @IsOptional()
  @IsString()
  metaDescription: string;

  @ApiProperty({
    description: "SEO keywords",
    example: ["keyword1", "keyword2"],
    required: false,
  })
  @IsArray()
  @IsOptional()
  metaKeywords?: string[];

  @ApiProperty({
    description: "Canonical URL",
    example: "https://example.com/my-page",
    required: false,
  })
  @IsString()
  @IsOptional()
  canonical?: string;

  constructor(partial: Partial<PageSeoDto>) {
    Object.assign(this, partial);
  }
}
