import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { PageBlockModel } from "../models/page-block.model";

export class PageBlockDto implements PageBlockModel {
  @ApiProperty({
    description: 'Block type (e.g., "text", "image", etc.)',
    example: "text",
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: "The display order of the block",
    example: 1,
  })
  @IsNumber()
  order: number;

  @ApiProperty({
    description: "Content of the block (can be any type of data)",
    example: "This is a sample text block content.",
  })
  @IsOptional()
  content?: unknown;

  @ApiProperty({
    description: "Additional settings for the block",
    example: { alignment: "center" },
    required: false,
  })
  @IsOptional()
  settings?: Record<string, any>;

  constructor(partial: Partial<PageBlockDto>) {
    Object.assign(this, partial);
  }
}
