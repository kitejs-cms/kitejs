import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Product, ProductSchema } from "./schemas/product.schema";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import {
  SlugRegistryModule,
  StorageModule,
  UsersModule,
} from "@kitejs-cms/core";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    SlugRegistryModule,
    StorageModule,
    UsersModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
