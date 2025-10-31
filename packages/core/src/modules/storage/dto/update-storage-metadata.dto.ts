import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { UpdateStorageMetadata } from "../models/update-storage-metadata.model";

/**
 * DTO for updating storage metadata such as alt, title, and description.
 */
export class UpdateStorageMetadataDto implements UpdateStorageMetadata {
  @ApiProperty({
    description: "Language code for the metadata update (e.g. 'en').",
    example: "en",
  })
  @IsNotEmpty()
  @IsString()
  language: string;

  @ApiPropertyOptional({
    description:
      "Alternative text for accessibility and SEO. Example: 'Dog photo'.",
    example: "Dog photo",
  })
  @IsOptional()
  @IsString()
  alt?: string;

  @ApiPropertyOptional({
    description:
      "Title text displayed as tooltip in browsers. Example: 'Golden Retriever running'.",
    example: "Golden Retriever running",
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description:
      "Extended description for SEO or Open Graph. Example: 'High-resolution image for blog SEO purposes'.",
    example: "High-resolution image for blog SEO purposes",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: "MIME type of the file (e.g., image/jpeg).",
    example: "image/png",
  })
  @IsOptional()
  @IsString()
  mediaType?: string;

  @ApiPropertyOptional({
    description: "File size in bytes.",
    example: 204800,
  })
  @IsOptional()
  @IsNumber()
  size?: number;

  @ApiPropertyOptional({
    description: "Absolute or signed URL of the media file.",
    example: "https://cdn.example.com/uploads/dog.jpg",
  })
  @IsOptional()
  @IsString()
  url?: string;

  constructor(partial: Partial<UpdateStorageMetadataDto>) {
    Object.assign(this, partial);
  }
}
