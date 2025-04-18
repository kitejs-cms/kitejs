import { Prop, Schema } from "@nestjs/mongoose";
import { Schema as SchemaDb } from "mongoose";

@Schema({ _id: false })
export class PageBlock {
  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: Number, required: true })
  order: number;

  @Prop({ type: SchemaDb.Types.Mixed, required: true })
  content: any;

  @Prop({ type: SchemaDb.Types.Mixed, default: {} })
  settings?: Record<string, any>;
}
