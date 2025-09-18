import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  ProductCollection,
  ProductCollectionSchema,
} from "./schemas/product-collection.schema";
import { CollectionsService } from "./collections.service";
import { CollectionsController } from "./collections.controller";
import { SlugRegistryModule, UsersModule } from "@kitejs-cms/core";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductCollection.name, schema: ProductCollectionSchema },
    ]),
    UsersModule,
    SlugRegistryModule,
  ],
  controllers: [CollectionsController],
  providers: [CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
