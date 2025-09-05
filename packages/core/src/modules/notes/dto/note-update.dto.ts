import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class NoteUpdateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  constructor(partial: Partial<NoteUpdateDto>) {
    Object.assign(this, partial);
  }
}
