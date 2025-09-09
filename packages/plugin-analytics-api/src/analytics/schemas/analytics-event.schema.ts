import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { ANALYTICS_PLUGIN_NAMESPACE } from "../../constants";

@Schema({
  collection: `plugin-${ANALYTICS_PLUGIN_NAMESPACE}-events`,
  timestamps: true,
  toJSON: { getters: true },
})
export class AnalyticsEvent extends Document {
  @Prop({ type: String, required: true })
  type!: string;

  @Prop({ type: Object, default: {} })
  payload?: Record<string, any>;

  @Prop({ type: String })
  userAgent?: string;

  @Prop({ type: Number })
  age?: number;

  @Prop({ type: String })
  origin?: string;

  @Prop({ type: String })
  ip?: string;

  @Prop({ type: Object })
  geo?: Record<string, any>;

  @Prop({ type: String })
  fingerprint?: string;
}

export const AnalyticsEventSchema = SchemaFactory.createForClass(AnalyticsEvent);

export type AnalyticsEventDocument = AnalyticsEvent & Document;
