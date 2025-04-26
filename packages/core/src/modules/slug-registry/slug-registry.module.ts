import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SlugRegistrySchema, SlugRegistry } from "./slug-registry.schema";
import { SlugRegistryService } from "./slug-registry.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SlugRegistry.name, schema: SlugRegistrySchema },
    ]),
  ],
  providers: [SlugRegistryService],
  exports: [SlugRegistryService],
})
export class SlugRegistryModule {}
