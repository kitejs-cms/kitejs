import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as SchemaDb } from 'mongoose';

@Schema({ timestamps: true, toJSON: { getters: true } })
export class Role extends Document {
  @Prop({ type: String, required: true, unique: true })
  name: string;

  @Prop({ type: String, required: false, unique: false })
  description: string;

  @Prop({
    type: [{ type: SchemaDb.ObjectId, ref: 'Permission' }],
    default: [],
  })
  permissions: Types.ObjectId[];
}

export const RoleSchema = SchemaFactory.createForClass(Role);
