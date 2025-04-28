import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { PageStatus } from "../models/page-status.enum";
import { PageSeoDto } from "./page-seo.dto";
import { PageBlockDto } from "./page-block.dto";
import { PageUpsertModel } from "../models/page-upsert.model";
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsEnum,
  IsDateString,
  ValidateIf,
} from "class-validator";

export class PageUpsertDto implements PageUpsertModel {
  @ApiPropertyOptional({
    description: "Optional ID for existing page updates",
    example: "60f7c0a2d3a8f009e6f0b7d1",
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: "Unique slug identifier for the page",
    example: "home-page",
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({
    description: "Language code for the page content",
    example: "en",
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  language: string;

  @ApiProperty({
    description: "Current status of the page",
    enum: PageStatus,
    example: PageStatus.Draft,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(PageStatus)
  status: PageStatus;

  @ApiPropertyOptional({
    description: "Array of tags for categorization",
    example: ["home", "main"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

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

  @ApiProperty({
    description: "Title of the page",
    example: "Welcome to our website",
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: "Description of the page",
    example: "This is our main landing page",
    required: true,
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: "Content blocks for the page",
    type: [PageBlockDto],
    required: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PageBlockDto)
  blocks: PageBlockDto[];

  @ApiPropertyOptional({
    description: "SEO metadata for the page",
    type: PageSeoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PageSeoDto)
  seo?: PageSeoDto;

  constructor(partial: Partial<PageUpsertDto>) {
    Object.assign(this, partial);
  }
}
