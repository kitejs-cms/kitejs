import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CopyPathDto {
  @ApiProperty({
    description: "Current path of the item to copy",
  })
  @IsString()
  sourcePath: string;

  @ApiProperty({
    description: "Destination path where the copy should be placed",
  })
  @IsString()
  destinationPath: string;

  constructor(partial: Partial<CopyPathDto>) {
    Object.assign(this, partial);
  }
}
