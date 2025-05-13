import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";
import { CategoryTranslationModel } from "../models/category-translation.model";

export class CategoryTranslationDto implements CategoryTranslationModel {
  @ApiProperty({
    description: "The title of the category translation",
    example: "News",
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: "The description of the category translation",
    example: "This is the description of the category in English.",
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: "The category slug, used as a unique identifier in the URL",
    example: "news",
  })
  @IsNotEmpty()
  @IsString()
  slug: string;

  constructor(partial: Partial<CategoryTranslationDto>) {
    Object.assign(this, partial);
  }
}
