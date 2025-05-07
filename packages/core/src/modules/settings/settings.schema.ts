import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { SettingType } from "./models/setting-type.enum";
import { CORE_NAMESPACE } from "../../constants";

export type SettingDocument = Setting & Document;

@Schema({
  collection: `${CORE_NAMESPACE}_settings`,
  timestamps: true,
  toJSON: { getters: true },
})
export class Setting<T = Record<string, unknown>> {
  @Prop({ type: String, required: true })
  key: string;

  @Prop({ type: String, required: true })
  namespace: string;

  @Prop({ type: Object })
  value: T;

  @Prop({
    type: String,
    enum: SettingType,
    required: true,
    default: SettingType.OTHER,
  })
  type: SettingType;
}

const SettingSchema = SchemaFactory.createForClass(Setting);

SettingSchema.index({ namespace: 1, key: 1 }, { unique: true });

export { SettingSchema };
