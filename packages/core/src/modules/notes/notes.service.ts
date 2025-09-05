import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Note } from './schemas/note.schema';
import { NoteCreateDto } from './dto/note-create.dto';
import { NoteResponseModel } from './models/note-response.model';
import { NoteSource } from './models/note-source.enum';
import { Injectable } from '@nestjs/common';
import { JwtPayloadModel } from '../auth';
import { ObjectIdUtils } from '../../common';
import { User } from '../users';

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
    await note.populate<{ createdBy: User }>('createdBy');
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
      .populate<{ createdBy: User }>('createdBy')
      .exec();
    return notes.map((n) => new NoteResponseModel(n));
  }

  async deleteNote(id: string): Promise<void> {
    await this.noteModel.findOneAndUpdate(
      {
        _id: ObjectIdUtils.toObjectId(id),
        source: NoteSource.ADMIN,
        deletedAt: null,
      },
      { deletedAt: new Date() }
    );
  }

  async updateNote(id: string, content: string): Promise<NoteResponseModel> {
    const note = await this.noteModel
      .findOneAndUpdate(
        {
          _id: ObjectIdUtils.toObjectId(id),
          source: NoteSource.ADMIN,
          deletedAt: null,
        },
        { content },
        { new: true }
      )
      .populate<{ createdBy: User }>('createdBy');

    return note ? new NoteResponseModel(note) : null;
  }
}
