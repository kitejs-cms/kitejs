import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Type } from "class-transformer";
import { ObjectId } from "mongoose";
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { CategoryResponseDetailsModel } from "../models/category-response-details.model";
import { CategoryTranslationDto } from "./category-translation.dto";

export class CategoryResponseDetailDto implements CategoryResponseDetailsModel {
  @ApiProperty({
    description: "Unique identifier of the category",
    example: "60f7c0a2d3a8f009e6f0b7d1",
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: "Base slug for the category (used for routing)",
    example: "my-category",
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    description: "Identifier of the user who created the category",
    example: "60f7bf5bd3a8f009e6f0b7d0",
  })
  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @ApiProperty({
    description: "Identifier of the user who last updated the category",
    example: "60f7bf5bd3a8f009e6f0b7d0",
  })
  @IsString()
  @IsNotEmpty()
  updatedBy: string;

  @ApiProperty({
    description: "Tags associated with the category",
    example: ["news", "sports"],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({
    description: "Parent category identifier (if any)",
    example: "60f7c0a2d3a8f009e6f0b7d2",
    required: false,
  })
  @IsOptional()
  @IsString()
  parent?: string;

  @ApiProperty({
    description: "Indicates if the category is active",
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;

  @ApiProperty({
    description: "Category translations, keyed by language code",
    type: () => CategoryTranslationDto,
    isArray: true,
    example: {
      en: {
        title: "Home Category",
        description: "This is the English category description.",
        slug: "home-category",
      },
    },
  })
  @ValidateNested({ each: true })
  @Type(() => CategoryTranslationDto)
  translations: Record<string, CategoryTranslationDto>;

  @ApiProperty({
    description: "Creation timestamp of the category (ISO string)",
    example: "2025-04-09T10:00:00Z",
  })
  @IsString()
  @IsNotEmpty()
  createdAt: string;

  @ApiProperty({
    description: "Last update timestamp of the category (ISO string)",
    example: "2025-04-09T11:00:00Z",
  })
  @IsString()
  @IsNotEmpty()
  updatedAt: string;

  @Exclude()
  _id: ObjectId;

  constructor(partial: Partial<CategoryResponseDetailDto>) {
    Object.assign(this, partial);

    // Convert translations to DTO format
    const translations = Object.keys(partial.translations || {}).reduce(
      (acc, key) => {
        acc[key] = new CategoryTranslationDto(partial.translations[key]);
        return acc;
      },
      {} as Record<string, CategoryTranslationDto>
    );

    this.translations = translations;
  }
}
