import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CategoryUpsertModel } from "../models/category-upsert.model";
import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CategoryUpsertDto implements CategoryUpsertModel {
  @ApiPropertyOptional({
    description: "Optional ID for existing category updates",
    example: "60f7c0a2d3a8f009e6f0b7d1",
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: "Unique slug identifier for the category",
    example: "home-category",
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({
    description: "Language code for the category content",
    example: "en",
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  language: string;

  @ApiPropertyOptional({
    description: "Array of tags for categorization",
    example: ["home", "main"],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({
    description: "Title of the category",
    example: "Welcome to our website",
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: "Description of the category",
    example: "This is our main landing category",
    required: true,
  })
  @IsString()
  description: string;

  constructor(partial: Partial<CategoryUpsertDto>) {
    Object.assign(this, partial);
  }
}
