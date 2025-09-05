import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Note } from './schemas/note.schema';
import { NoteCreateDto } from './dto/note-create.dto';
import { NoteResponseModel } from './models/note-response.model';
import { NoteSource } from './models/note-source.enum';
import { Injectable } from '@nestjs/common';
import { JwtPayloadModel } from '../auth';
import { ObjectIdUtils } from '../../common';

@Injectable()
export class NotesService {
  constructor(@InjectModel(Note.name) private readonly noteModel: Model<Note>) {}

  async createNote(
    dto: NoteCreateDto,
    user: JwtPayloadModel
  ): Promise<NoteResponseModel> {
    const note = await this.noteModel.create({
      target: ObjectIdUtils.toObjectId(dto.targetId),
      targetType: dto.targetType,
      content: dto.content,
      source: dto.source,
      createdBy: dto.source === NoteSource.ADMIN ? user.sub : null,
    });
    return new NoteResponseModel(note);
  }

  async findNotes(
    targetId: string,
    targetType: string,
    source?: NoteSource
  ): Promise<NoteResponseModel[]> {
    const query: any = {
      target: ObjectIdUtils.toObjectId(targetId),
      targetType,
      deletedAt: null,
    };
    if (source) {
      query.source = source;
    }
    const notes = await this.noteModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();
    return notes.map((n) => new NoteResponseModel(n));
  }
}
