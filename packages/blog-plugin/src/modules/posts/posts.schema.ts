import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { BLOG_NAMESPACE } from "../../constants";
import { Types } from "mongoose";
import { Page } from "@kitejs-cms/core/index";

@Schema({
  collection: `${BLOG_NAMESPACE}_posts`,
  timestamps: true,
  toJSON: { getters: true },
})
export class Post extends Page {
  @Prop({ type: [Types.ObjectId], ref: "Category", default: [] })
  categories: Types.ObjectId[];

  @Prop({ type: String, default: null })
  coverImage: string;
}

export const PostSchema = SchemaFactory.createForClass(Post);
