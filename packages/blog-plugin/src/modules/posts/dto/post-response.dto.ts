import { ApiProperty } from "@nestjs/swagger";
import { PostResponseModel } from "../models/post-response.model";
import { IsArray, IsOptional, IsString, IsUrl } from "class-validator";
import { PageResponseDto } from "@kitejs-cms/core/modules/pages/dto/page-response.dto";

export class PostResponseDto
  extends PageResponseDto
  implements PostResponseModel
{
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

  constructor(partial: Partial<PostResponseDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
