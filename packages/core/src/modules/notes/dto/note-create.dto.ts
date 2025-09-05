import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { NoteSource } from '../models/note-source.enum';

export class NoteCreateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  targetType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ enum: NoteSource })
  @IsEnum(NoteSource)
  source: NoteSource;

  constructor(partial: Partial<NoteCreateDto>) {
    Object.assign(this, partial);
  }
}
