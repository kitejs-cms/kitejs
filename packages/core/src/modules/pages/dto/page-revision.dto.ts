import { PageRevisionModel } from "../models/page-revision.model";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { PageDto } from "./page-detail.dto";
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  ValidateNested,
} from "class-validator";

export class PageRevisionDto implements PageRevisionModel {
  @ApiProperty({
    description: "Unique identifier of the revision",
    example: "609d1b8e2f8fb814c8c4aeca",
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: "ID of the original page",
    example: "60f7c0a2d3a8f009e6f0b7d1",
  })
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @ApiProperty({
    description: "Version number of the revision",
    example: 3,
  })
  @IsNumber()
  version: number;

  @ApiProperty({
    description: "Snapshot of the page data at the time of the revision",
    type: PageDto,
  })
  @ValidateNested()
  @Type(() => PageDto)
  data: PageDto;

  @ApiProperty({
    description: "ID of the user who modified the page for this revision",
    example: "60f7bf5bd3a8f009e6f0b7d0",
  })
  @IsString()
  @IsNotEmpty()
  modifiedBy: string;

  @ApiProperty({
    description: "Timestamp of the revision",
    example: "2025-04-09T12:00:00Z",
  })
  @IsString()
  @IsNotEmpty()
  timestamp: string;

  constructor(partial: Partial<PageRevisionDto>) {
    Object.assign(this, partial);
  }
}
