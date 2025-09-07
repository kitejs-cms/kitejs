import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { PluginStatus } from "./models/plugin-response.model";
import { CORE_NAMESPACE } from "../../constants";

export type PluginDocument = Plugin & Document & { id: string };

@Schema({
  collection: `${CORE_NAMESPACE}_plugins`,
  timestamps: true,
  toJSON: { getters: true },
})
export class Plugin {
  @Prop({ type: String, required: true, unique: true, index: true })
  namespace: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: false, default: "1.0.0" })
  version: string;

  @Prop({ type: String, required: false })
  author?: string;

  @Prop({ type: String, required: false })
  description?: string;

  @Prop({ type: Date, default: Date.now })
  installedAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @Prop({ type: [String], required: false, default: [] })
  dependencies: string[];

  @Prop({ type: Boolean, default: true })
  enabled: boolean;

  @Prop({ type: Boolean, default: false })
  pendingDisable: boolean;

  @Prop({ type: Boolean, default: false })
  requiresRestart: boolean;

  @Prop({
    type: String,
    enum: Object.values(PluginStatus),
    default: PluginStatus.PENDING,
  })
  status: PluginStatus;

  @Prop({ type: String, required: false, default: null })
  lastError: string | null;
}

const PluginSchema = SchemaFactory.createForClass(Plugin);

export { PluginSchema };
