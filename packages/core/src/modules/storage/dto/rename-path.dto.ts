import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class RenamePathDto {
  @ApiProperty({
    description: "Current path of the item to rename",
  })
  @IsString()
  oldPath: string;

  @ApiProperty({
    description: "New path for the renamed item",
  })
  @IsString()
  newPath: string;

  constructor(partial: Partial<RenamePathDto>) {
    Object.assign(this, partial);
  }
}
