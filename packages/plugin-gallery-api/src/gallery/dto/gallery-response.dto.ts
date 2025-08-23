import { ApiProperty } from "@nestjs/swagger";
import { GalleryResponseModel } from "../models/gallery-response.model";
import { GalleryStatus } from "../models/gallery-status.enum";
import { Exclude, Type } from "class-transformer";
import type { ObjectId } from "mongoose";
import { ValidateNested } from "class-validator";
import { GalleryItemDto } from "./gallery-item.dto";
import { GallerySettingsDto } from "./gallery-settings.dto";

export class GalleryResponseDto implements GalleryResponseModel {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: GalleryStatus })
  status: GalleryStatus;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty()
  publishAt?: Date;

  @ApiProperty()
  expireAt?: Date;

  @ApiProperty({ type: Object })
  translations: GalleryResponseModel["translations"];

  @ApiProperty({ type: () => [GalleryItemDto] })
  @ValidateNested({ each: true })
  @Type(() => GalleryItemDto)
  items: GalleryItemDto[];

  @ApiProperty({ type: () => GallerySettingsDto, required: false })
  @ValidateNested()
  @Type(() => GallerySettingsDto)
  settings?: GallerySettingsDto;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  updatedBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @Exclude()
  _id: ObjectId;

  @Exclude()
  __v: number;

  constructor(model: GalleryResponseModel) {
    Object.assign(this, model);
    this.id = model.id;
  }
}
