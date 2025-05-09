import { PageUpsertDto } from "@kitejs-cms/core/modules/pages/dto/page-upsert.dto";
import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString, IsUrl } from "class-validator";
import { PostUpsertModel } from "../models/post-upsert.model";

export class PostUpsertDto extends PageUpsertDto implements PostUpsertModel {
  @ApiProperty({
    description:
      "Array of categories associated with the post. Each category is represented as a string.",
    example: ["technology", "education"],
    required: true,
  })
  @IsString({ each: true })
  @IsArray()
  categories: string[];

  @ApiProperty({
    description: "URL of the cover image for the post. This field is optional.",
    example: "https://example.com/images/cover.jpg",
    required: false,
  })
  @IsUrl()
  @IsOptional()
  coverImage?: string;

  constructor(partial: Partial<PostUpsertDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
