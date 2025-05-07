import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { CORE_NAMESPACE } from "../../../constants";
import { Document } from "mongoose";

@Schema({
  collection: `${CORE_NAMESPACE}_permissions`,
  timestamps: true,
  toJSON: { getters: true },
})
export class Permission extends Document {
  @Prop({ type: String, required: true, unique: true })
  name: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: String, required: true })
  namespace: string;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
