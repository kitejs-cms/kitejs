import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import type { NoteResponseModel } from '../models/note-response.model';
import { NoteSource } from '../models/note-source.enum';

export class NoteResponseDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ enum: NoteSource })
  @IsEnum(NoteSource)
  source: NoteSource;

  @ApiProperty()
  @IsString()
  content: string;

  @Exclude()
  @IsString()
  targetId: string;

  @Exclude()
  @IsString()
  targetType: string;

  @ApiProperty()
  @IsDate()
  createdAt: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  createdBy?: string;

  constructor(partial: Partial<NoteResponseDto | NoteResponseModel>) {
    Object.assign(this, partial);
  }
}
