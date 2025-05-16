import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Exclude, Type } from "class-transformer";
import { PageStatus } from "../models/page-status.enum";
import { PageResponseDetailsModel } from "../models/page-response-details.model";
import { PageSeoDto } from "./page-seo.dto";
import { PageTranslationDto } from "./page-translation.dto";
import { ObjectId } from "mongoose";
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

export class PageResponseDetailDto implements PageResponseDetailsModel {
  @ApiProperty({
    description: "Unique identifier of the page",
    example: "60f7c0a2d3a8f009e6f0b7d1",
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({
    description: "Optional url image",
    example: "https://img-example.com/img1",
  })
  @IsOptional()
  @IsString()
  image?: string

  @ApiProperty({
    description: "Base slug for the page (used for routing)",
    example: "my-page",
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    description: "Identifier of the user who created the page",
    example: "60f7bf5bd3a8f009e6f0b7d0",
  })
  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @ApiProperty({
    description: "Identifier of the user who last updated the page",
    example: "60f7bf5bd3a8f009e6f0b7d0",
  })
  @IsString()
  @IsNotEmpty()
  updatedBy: string;

  @ApiProperty({
    description: "Status of the page",
    enum: PageStatus,
    example: PageStatus.Published,
  })
  @IsString()
  @IsNotEmpty()
  status: PageStatus;

  @ApiProperty({
    description: "Tags associated with the page",
    example: ["news", "sports"],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    description: "Publish date of the page (ISO string)",
    example: "2025-04-09T10:00:00Z",
    required: false,
  })
  @IsOptional()
  @IsString()
  publishAt?: string;

  @ApiProperty({
    description: "Expiration date of the page (ISO string)",
    example: "2025-04-10T10:00:00Z",
    required: false,
  })
  @IsOptional()
  @IsString()
  expireAt?: string;

  @ApiProperty({
    description: "Page translations, keyed by language code",
    type: () => Map<String, PageTranslationDto>,
    example: {
      en: {
        title: "Home Page",
        description: "This is the English home page.",
        blocks: [
          {
            type: "text",
            order: 1,
            content: "Welcome to our website",
            settings: { alignment: "center" },
          },
        ],
        seo: {
          metaTitle: "Home Page SEO",
          metaDescription: "SEO description for the home page",
          metaKeywords: ["home", "page"],
          canonical: "https://example.com/home",
        },
      },
    },
  })
  @ValidateNested({ each: true })
  @Type(() => PageTranslationDto)
  translations: Record<string, PageTranslationDto>;

  @ApiProperty({
    description:
      "Global SEO settings for the page (fallback if not defined in translations)",
    type: PageSeoDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PageSeoDto)
  seo?: Record<string, PageSeoDto>;

  @ApiProperty({
    description: "Creation timestamp of the page (ISO string)",
    example: "2025-04-09T10:00:00Z",
  })
  @IsString()
  @IsNotEmpty()
  createdAt: string;

  @ApiProperty({
    description: "Last update timestamp of the page (ISO string)",
    example: "2025-04-09T11:00:00Z",
  })
  @IsString()
  @IsNotEmpty()
  updatedAt: string;


  @ApiProperty({
    description: "Array of category IDs associated with the page",
    example: ["60f7c0a2d3a8f009e6f0b7d2", "60f7c0a2d3a8f009e6f0b7d3"],
    type: [String],
  })
  @IsArray()
  @IsMongoId({ each: true })
  categories: string[];

  @Exclude()
  _id: ObjectId;

  @Exclude()
  __v: number;

  constructor(partial: Partial<PageResponseDetailDto>) {
    Object.assign(this, partial);

    const translations = Object.keys(partial.translations).reduce(
      (acc, key) => {
        acc[key] = new PageTranslationDto(partial.translations[key]);
        return acc;
      },
      {}
    );

    this.translations = translations;
  }
}
