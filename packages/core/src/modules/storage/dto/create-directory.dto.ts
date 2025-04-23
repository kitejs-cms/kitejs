import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateDirectoryDto {
  @ApiProperty({
    description: "The path where the empty directory should be created",
  })
  @IsString()
  directoryPath: string;

  constructor(partial: Partial<CreateDirectoryDto>) {
    Object.assign(this, partial);
  }
}
