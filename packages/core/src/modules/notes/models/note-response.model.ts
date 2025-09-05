import { Note } from '../schemas/note.schema';
import { NoteSource } from './note-source.enum';
import { User } from '../../users';

export class NoteResponseModel {
  id: string;
  source: NoteSource;
  content: string;
  targetId: string;
  targetType: string;
  createdAt: Date;
  createdBy?: string;

  constructor(note: Note & { createdBy?: User }) {
    this.id = note._id.toString();
    this.source = note.source;
    this.content = note.content;
    this.targetId = note.target.toString();
    this.targetType = note.targetType;
    this.createdAt = note.createdAt;
    if (note.createdBy) {
      this.createdBy = `${note.createdBy.firstName} ${note.createdBy.lastName}`;
    }
  }
}
