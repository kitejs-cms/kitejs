import { CategoryResponseModel } from "../models/category-response.model";
import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class CategoryResponseDto implements CategoryResponseModel {
  @ApiProperty({
    description: "Unique slug for the page",
    example: "my-page",
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    description: "Tags associated with the page",
    example: ["news", "sports"],
    required: false,
  })
  @IsArray()
  tags: string[];

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
    description: "Language code of the translation",
    example: "en",
  })
  @IsString()
  @IsNotEmpty()
  language: string;

  @ApiProperty({
    description: "Indicates whether the category is active or not",
    example: true,
  })
  @IsBoolean()
  isActive: boolean;

  constructor(partial: Partial<CategoryResponseDto>) {
    Object.assign(this, partial);
  }
}
