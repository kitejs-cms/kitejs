import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type {
  BreakpointSettingsModel,
  ResponsiveGallerySettingsModel,
} from "../models/gallery-settings.model";

@Schema({ _id: false })
export class GallerySettings {
  @Prop({ type: String, enum: ["grid", "masonry", "slider"], default: "grid" })
  layout: "grid" | "masonry" | "slider";

  @Prop({ type: String, enum: ["responsive", "manual"], default: "responsive" })
  mode: "responsive" | "manual";

  @Prop({
    type: {
      desktop: { columns: { type: Number }, gap: { type: Number } },
      tablet: { columns: { type: Number }, gap: { type: Number } },
      mobile: { columns: { type: Number }, gap: { type: Number } },
    },
    _id: false,
    required: false,
    default: undefined,
  })
  responsive?: ResponsiveGallerySettingsModel;

  @Prop({
    type: { columns: { type: Number }, gap: { type: Number } },
    _id: false,
    required: false,
    default: undefined,
  })
  manual?: BreakpointSettingsModel;

  @Prop({ type: String, default: "auto" })
  ratio: string;
}

export const GallerySettingsSchema =
  SchemaFactory.createForClass(GallerySettings);
