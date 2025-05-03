import { IsString, IsNotEmpty, IsOptional, IsArray } from "class-validator";
import { PageBlockModel } from "../models/page-block.model";
import { ApiProperty } from "@nestjs/swagger";

export class PageBlockDto implements PageBlockModel {
  @ApiProperty()
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  content?: Record<string, unknown>[];

  @ApiProperty()
  @IsOptional()
  props?: Record<string, any>;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  children?: PageBlockDto[];

  constructor(partial: Partial<PageBlockDto>) {
    Object.assign(this, partial);

    if (partial && partial.content !== undefined) {
      partial.content = partial.content.map((item) => ({
        ...item,
        styles: item.styles || {},
      }));
    }
  }
}
