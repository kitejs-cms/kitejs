import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UsersModule } from "@kitejs-cms/core";
import {
  CustomerAddress,
  CustomerAddressSchema,
} from "./schemas/customer-address.schema";
import { CustomersService } from "./services/customers.service";
import { CustomersController } from "./controllers/customers.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CustomerAddress.name, schema: CustomerAddressSchema },
    ]),
    UsersModule,
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
