import { ApiProperty } from '@nestjs/swagger';
import { NoteResponseModel } from '../models/note-response.model';
import { NoteSource } from '../models/note-source.enum';

export class NoteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: NoteSource })
  source: NoteSource;

  @ApiProperty()
  content: string;

  @ApiProperty()
  targetId: string;

  @ApiProperty()
  targetType: string;

  @ApiProperty()
  createdAt: Date;

  constructor(model: NoteResponseModel) {
    this.id = model.id;
    this.source = model.source;
    this.content = model.content;
    this.targetId = model.targetId;
    this.targetType = model.targetType;
    this.createdAt = model.createdAt;
  }
}
