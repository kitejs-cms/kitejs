import { Prop, Schema } from "@nestjs/mongoose";
import { Schema as SchemaDb } from "mongoose";

@Schema({ _id: false })
export class PageBlock {
  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: SchemaDb.Types.Mixed, required: false })
  props?: Record<string, unknown>;

  @Prop({ type: SchemaDb.Types.Mixed, required: true })
  content: Record<string, unknown>;

  @Prop({ type: SchemaDb.Types.Mixed, default: {} })
  settings?: Record<string, unknown>;

  @Prop({ type: SchemaDb.Types.Mixed, required: false })
  children?: Record<string, unknown>;
}
