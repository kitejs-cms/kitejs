import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { NoteSource } from '../models/note-source.enum';

export class NoteCreateDto {
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @IsString()
  @IsNotEmpty()
  targetType: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(NoteSource)
  source: NoteSource;
}
