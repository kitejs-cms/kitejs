import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type StorageDocument = Storage & Document;

@Schema({ timestamps: true, toJSON: { getters: true } })
export class Storage extends Document {
  @Prop({ type: String, required: true })
  fileName: string;

  @Prop({ type: String, required: true, unique: true })
  filePath: string;

  @Prop({ type: String })
  url?: string;

  @Prop({ type: Map, of: String })
  alt?: Map<string, string>;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: Number })
  size?: number;

  @Prop({ type: String })
  mediaType?: string;

  @Prop({ type: Object })
  dimensions?: {
    width?: number;
    height?: number;
  };
}

export const StorageSchema = SchemaFactory.createForClass(Storage);
