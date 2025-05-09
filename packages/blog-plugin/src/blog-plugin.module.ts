import { Module } from "@nestjs/common";
import { CategoriesModule } from "./modules/categories";
import { PostsModule } from "./modules/posts";

@Module({
  imports: [CategoriesModule, PostsModule],
})
export class BlogPluginModule {}
