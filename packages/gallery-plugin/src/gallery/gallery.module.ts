import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Gallery, GallerySchema } from "./schemas/gallery.schema";
import { GalleryController } from "./gallery.controller";
import { GalleryService } from "./services/gallery.service";
import { SlugRegistryModule, CategoriesModule } from "@kitejs-cms/core";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Gallery.name, schema: GallerySchema }]),
    SlugRegistryModule,
    CategoriesModule,
  ],
  controllers: [GalleryController],
  providers: [GalleryService],
  exports: [GalleryService],
})
export class GalleryModule {}
