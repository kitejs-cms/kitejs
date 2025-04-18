import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { PageDetailModel, PageStatus } from "../models/page-detail.model";
import { PageTranslationModel } from "../models/page-translation.model";

export class PageDto implements PageDetailModel {
  @ApiProperty({
    description: "Unique identifier of the page",
    example: "60f7c0a2d3a8f009e6f0b7d1",
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: "Unique slug for the page",
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
  translations: Record<string, PageTranslationModel>;

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
}
