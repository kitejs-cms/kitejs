import { Module } from "@nestjs/common";
import { ProductsModule } from "./products/products.module";
import { CollectionsModule } from "./collections/collections.module";
import { CustomerAddressesModule } from "./customer-addresses/customer-addresses.module";
import { OrdersModule } from "./orders/orders.module";

@Module({
  imports: [
    ProductsModule,
    CollectionsModule,
    CustomerAddressesModule,
    OrdersModule,
  ],
  exports: [
    ProductsModule,
    CollectionsModule,
    CustomerAddressesModule,
    OrdersModule,
  ],
})
export class CommerceModule {}
