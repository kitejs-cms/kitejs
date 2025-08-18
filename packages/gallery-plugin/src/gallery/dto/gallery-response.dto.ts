import { ApiProperty } from "@nestjs/swagger";
import { GalleryResponseModel } from "../models/gallery-response.model";
import { GalleryStatus } from "../models/gallery-status.enum";

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

  @ApiProperty({ type: Object })
  items: GalleryResponseModel["items"];

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  updatedBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(model: GalleryResponseModel) {
    Object.assign(this, model);
    this.id = model.id;
  }
}

