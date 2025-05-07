import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaDb, Types } from "mongoose";
import { Page, PageSchema } from "./page.schema";
import { CORE_NAMESPACE } from "../../../constants";

@Schema({ collection: `${CORE_NAMESPACE}_pagerevisions`, timestamps: true })
export class PageRevision extends Document {
  @Prop({ type: SchemaDb.ObjectId, ref: "Page", required: true })
  pageId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  version: number;

  @Prop({ type: PageSchema, required: true })
  snapshot: Page;

  @Prop({ type: SchemaDb.ObjectId, ref: "User", required: true })
  modifiedBy: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;
}

export const PageRevisionSchema = SchemaFactory.createForClass(PageRevision);
