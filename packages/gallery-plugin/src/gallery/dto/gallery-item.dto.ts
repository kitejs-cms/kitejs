import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsMongoId, IsOptional, IsString } from "class-validator";
import { GalleryItemModel } from "../models/gallery-item.model";
import { Exclude, Transform } from "class-transformer";
import type { ObjectId } from "mongoose";

export class GalleryItemDto implements GalleryItemModel {
  @ApiProperty({ description: "Asset ID", example: "60f7c0a2d3a8f009e6f0b7d1" })
  @IsMongoId()
  @Transform(({ value }) => value.toString())
  assetId: string;

  @ApiPropertyOptional({ description: "Order of the item", example: 0 })
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ description: "Caption for the item" })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ description: "Alternate text override" })
  @IsOptional()
  @IsString()
  altOverride?: string;

  @ApiPropertyOptional({ description: "Link URL" })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional({ enum: ["visible", "hidden"], default: "visible" })
  @IsOptional()
  @IsIn(["visible", "hidden"])
  visibility?: "visible" | "hidden";

  @Exclude()
  _id: ObjectId;

  @Exclude()
  __v: number;

  constructor(partial: Partial<GalleryItemDto>) {
    Object.assign(this, partial);
  }
}
