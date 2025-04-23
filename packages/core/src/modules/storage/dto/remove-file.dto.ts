import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class RemoveFileDto {
  @ApiProperty({
    description: "The full path or key of the file to remove",
  })
  @IsString()
  filePath: string;

  constructor(partial: Partial<RemoveFileDto>) {
    Object.assign(this, partial);
  }
}
