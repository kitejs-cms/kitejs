import { Module } from "@nestjs/common";
import { GalleryModule } from "./gallery";

@Module({
  imports: [GalleryModule],
})
export class GalleryPluginModule {}
