import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString } from "class-validator";

export class GallerySortDto {
  @ApiProperty({ type: [String], description: "Ordered list of item IDs" })
  @IsArray()
  @IsString({ each: true })
  itemIds: string[];

  constructor(partial: Partial<GallerySortDto>) {
    Object.assign(this, partial);
  }
}
