import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { CreateCollectionDto } from "./create-collection.dto";

export class UpdateCollectionDto extends PartialType(CreateCollectionDto) {
  @ApiProperty({ description: "Slug identifier for the collection" })
  @IsNotEmpty()
  @IsString()
  declare slug: string;

  @ApiProperty({ description: "Language for the localized payload" })
  @IsNotEmpty()
  @IsString()
  declare language: string;
}
