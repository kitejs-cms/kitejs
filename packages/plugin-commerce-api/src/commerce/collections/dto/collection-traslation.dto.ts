import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, ValidateNested } from "class-validator";
import { CollectionTranslationModel } from "../models/collection-translation.model";
import { CollectionSeoDto } from "./collection-seo.dto";
import { Type } from "class-transformer";

export class CollectionTranslationDto implements CollectionTranslationModel {
  @ApiProperty({
    description: "The title of the collection translation",
    example: "News",
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: "The description of the collection translation",
    example: "This is the description of the collection in English.",
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: "The collection slug, used as a unique identifier in the URL",
    example: "news",
  })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({
    description: "SEO settings for this page of collection",
    type: CollectionSeoDto,
  })
  @ValidateNested()
  @Type(() => CollectionSeoDto)
  seo: CollectionSeoDto;

  constructor(partial: Partial<CollectionTranslationDto>) {
    Object.assign(this, partial);
  }
}
