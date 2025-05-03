import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaDb, Types } from "mongoose";

@Schema({ timestamps: true, toJSON: { getters: true } })
export class SlugRegistry extends Document {
  @Prop({ type: String, required: true })
  slug: string;

  @Prop({ type: String, required: true })
  namespace: string;

  @Prop({ type: SchemaDb.Types.ObjectId, required: true })
  entityId: Types.ObjectId;

  @Prop({ type: String, required: false })
  language?: string;
}

export const SlugRegistrySchema = SchemaFactory.createForClass(SlugRegistry);

SlugRegistrySchema.index(
  { slug: 1, namespace: 1, language: 1, entityId: 1 },
  { unique: true }
);
