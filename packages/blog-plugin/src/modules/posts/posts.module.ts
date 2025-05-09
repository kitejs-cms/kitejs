import { SlugRegistryModule, CacheModule } from "@kitejs-cms/core/index";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Post, PostSchema } from "./posts.schema";
import { CategoriesModule } from "../categories";
import { PostsService } from "./posts.service";
import { PostsController } from "./post.controller";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    SlugRegistryModule,
    CategoriesModule,
    CacheModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
