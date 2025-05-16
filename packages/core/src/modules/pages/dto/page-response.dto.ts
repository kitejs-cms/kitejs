import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { PageBlockDto } from "./page-block.dto";
import { PageResponseModel } from "../models/page-response.model";
import { PageSeoDto } from "./page-seo.dto";
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { PageStatus } from "../models/page-status.enum";

export class PageResponseDto implements PageResponseModel {
  @ApiProperty({
    description: "Unique slug for the page",
    example: "my-page",
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({
    description: "Optional url image",
    example: "https://img-example.com/img1",
  })
  @IsOptional()
  @IsString()
  image?: string

  @ApiProperty({
    description: "Status of the page",
    example: PageStatus.Published,
    enum: PageStatus,
  })
  @IsString()
  @IsNotEmpty()
  status: PageStatus;

  @ApiProperty({
    description: "Tags associated with the page",
    example: ["news", "sports"],
    required: false,
  })
  @IsArray()
  tags: string[];

  @ApiProperty({
    description: "Publish date of the page (ISO string)",
    example: "2025-04-09T10:00:00Z",
    required: false,
  })
  @IsOptional()
  @IsString()
  publishAt?: string;

  @ApiProperty({
    description: "Title of the page in the selected language",
    example: "Home Page",
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: "Description of the page in the selected language",
    example: "This is the home page.",
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: "Blocks of content for the page translation",
    type: [PageBlockDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PageBlockDto)
  blocks: PageBlockDto[];

  @ApiProperty({
    description: "SEO settings for the page translation",
    type: PageSeoDto,
  })
  @ValidateNested()
  @Type(() => PageSeoDto)
  seo?: PageSeoDto;

  @ApiProperty({
    description: "Language code of the translation",
    example: "en",
  })
  @IsString()
  @IsNotEmpty()
  language: string;

  constructor(partial: Partial<PageResponseDto>) {
    Object.assign(this, partial);
  }
}
