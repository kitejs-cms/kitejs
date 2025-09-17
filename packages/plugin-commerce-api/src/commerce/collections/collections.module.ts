import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  ProductCollection,
  ProductCollectionSchema,
} from "./schemas/product-collection.schema";
import { CollectionsService } from "./services/collections.service";
import { CollectionsController } from "./controllers/collections.controller";
import { SlugRegistryModule } from "@kitejs-cms/core";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductCollection.name, schema: ProductCollectionSchema },
    ]),
    SlugRegistryModule,
  ],
  controllers: [CollectionsController],
  providers: [CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
