import { PartialType } from "@nestjs/mapped-types";
import { IsNotEmpty, IsString } from "class-validator";
import { CreateCollectionDto } from "./create-collection.dto";

export class UpdateCollectionDto extends PartialType(CreateCollectionDto) {
  @IsNotEmpty()
  @IsString()
  slug!: string;

  @IsNotEmpty()
  @IsString()
  language!: string;
}
