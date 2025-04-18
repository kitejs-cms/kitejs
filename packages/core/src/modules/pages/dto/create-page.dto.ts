import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { PageDetailModel, PageStatus } from "../models/page-detail.model";
import { PageTranslationDto } from "./page-translation.dto";

export class CreatePageDto implements Partial<PageDetailModel> {
  @ApiProperty({
    description: "Unique slug for the page",
    example: "my-page",
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    description: "Status of the page",
    enum: PageStatus,
    example: PageStatus.Published,
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: PageStatus;

  @ApiProperty({
    description: "Tags associated with the page",
    example: ["news", "sports"],
    required: false,
  })
  @IsOptional()
  @IsArray()
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
    example: {
      en: {
        title: "Home Page",
        description: "This is the English home page.",
        blocks: [],
        seo: {
          metaTitle: "Home Page SEO",
          metaDescription: "SEO description for the home page",
          metaKeywords: ["home", "page"],
          canonical: "https://example.com/home",
        },
      },
      it: {
        title: "Pagina Iniziale",
        description: "Questa è la homepage in italiano.",
        blocks: [],
        seo: {
          metaTitle: "Pagina Iniziale SEO",
          metaDescription: "Descrizione SEO per la pagina iniziale",
          metaKeywords: ["home", "pagina"],
          canonical: "https://example.com/pagina-iniziale",
        },
      },
    },
  })
  @ValidateNested({ each: true })
  @Type(() => PageTranslationDto)
  translations: Record<string, PageTranslationDto>;

  constructor(partial: Partial<CreatePageDto>) {
    Object.assign(this, partial);
  }
}
