import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class MovePathDto {
  @ApiProperty({
    description: "Current path of the item to move",
  })
  @IsString()
  sourcePath: string;

  @ApiProperty({
    description: "Destination path where the item should be moved",
  })
  @IsString()
  destinationPath: string;

  constructor(partial: Partial<MovePathDto>) {
    Object.assign(this, partial);
  }
}
