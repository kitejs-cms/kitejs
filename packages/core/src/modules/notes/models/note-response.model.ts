import { NoteSource } from './note-source.enum';

export type NoteResponseModel = {
  id: string;
  source: NoteSource;
  content: string;
  targetId: string;
  targetType: string;
  createdAt: Date;
  createdBy?: string;
};

