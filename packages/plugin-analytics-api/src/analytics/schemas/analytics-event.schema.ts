import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { ANALYTICS_PLUGIN_NAMESPACE } from "../../constants";

@Schema({
  collection: `plugin-${ANALYTICS_PLUGIN_NAMESPACE}_events`,
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

  @Prop({ type: String })
  origin?: string;

  @Prop({ type: String })
  identifier?: string;

  @Prop({ type: String })
  referrer?: string;

  @Prop({ type: Number })
  duration?: number;

  @Prop({ type: String })
  ip?: string;

  @Prop({ type: Object })
  geo?: Record<string, any>;

  @Prop({ type: String })
  fingerprint?: string;

  @Prop({ type: String })
  browser?: string;

  @Prop({ type: String })
  os?: string;

  @Prop({ type: String })
  device?: string;

  @Prop({ type: String })
  country?: string;

  @Prop({ type: String })
  region?: string;

  @Prop({ type: String })
  city?: string;
}

export const AnalyticsEventSchema =
  SchemaFactory.createForClass(AnalyticsEvent);

export type AnalyticsEventDocument = AnalyticsEvent & Document;
