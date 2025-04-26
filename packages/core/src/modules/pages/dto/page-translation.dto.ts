import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { PageBlockDto } from "./page-block.dto";
import { PageTranslationModel } from "../models/page-translation.model";
import { PageSeoDto } from "./page-seo.dto";

export class PageTranslationDto implements PageTranslationModel {
  @ApiProperty({
    description: "The title of the page translation",
    example: "Home Page",
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: "The description of the page translation",
    example: "This is the description of the home page in English.",
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: "An array of content blocks for this page translation",
    type: [PageBlockDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PageBlockDto)
  blocks: PageBlockDto[];

  @ApiProperty({
    description: "SEO settings for this page translation",
    type: PageSeoDto,
  })
  @ValidateNested()
  @Type(() => PageSeoDto)
  seo: PageSeoDto;

  @ApiProperty({
    description: "The page slug, used as a unique identifier in the URL",
    example: "about-us",
  })
  @IsNotEmpty()
  @IsString()
  slug: string;

  constructor(partial: Partial<PageTranslationDto>) {
    Object.assign(this, partial);
  }
}
