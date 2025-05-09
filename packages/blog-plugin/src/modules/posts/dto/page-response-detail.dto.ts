import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString, IsUrl } from "class-validator";
import { PageResponseDetailDto } from "@kitejs-cms/core/modules/pages/dto/page-response-detail.dto";
import { PostResponseDetailsModel } from "../models/post-response-details.model";

export class PostResponseDetailDto
  extends PageResponseDetailDto
  implements PostResponseDetailsModel
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

  constructor(partial: Partial<PageResponseDetailDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
