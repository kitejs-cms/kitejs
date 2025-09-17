import { Module } from "@nestjs/common";
import { ProductsModule } from "./products/products.module";
import { CollectionsModule } from "./collections/collections.module";
import { CustomersModule } from "./customers/customers.module";
import { OrdersModule } from "./orders/orders.module";

@Module({
  imports: [ProductsModule, CollectionsModule, CustomersModule, OrdersModule],
  exports: [ProductsModule, CollectionsModule, CustomersModule, OrdersModule],
})
export class CommerceModule {}
