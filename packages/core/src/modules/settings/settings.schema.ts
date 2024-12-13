import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type SettingDocument = Setting & Document;

@Schema({
  timestamps: true,
  strict: false,
})
export class Setting {
  @Prop({ type: String, required: true })
  key: string;

  @Prop({ type: String, required: true })
  namespace: string;

  @Prop({ type: Object })
  value: Record<string, any>;
}

const SettingSchema = SchemaFactory.createForClass(Setting);

SettingSchema.index({ namespace: 1, key: 1 }, { unique: true });

export { SettingSchema };
