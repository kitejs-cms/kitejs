import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as SchemaDb, Types } from 'mongoose';
import { CORE_NAMESPACE } from '../../../constants';
import { NoteSource } from '../models/note-source.enum';

@Schema({
  collection: `${CORE_NAMESPACE}_notes`,
  timestamps: true,
  toJSON: { getters: true },
})
export class Note extends Document {
  @Prop({ type: SchemaDb.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;

  @Prop({ type: String, enum: NoteSource, required: true })
  source: NoteSource;

  @Prop({ type: SchemaDb.ObjectId, refPath: 'targetType', required: true })
  target: Types.ObjectId;

  @Prop({ type: String, required: true })
  targetType: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;

  createdAt: Date;
}

export const NoteSchema = SchemaFactory.createForClass(Note);
