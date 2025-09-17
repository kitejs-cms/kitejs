import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CustomerAddress, CustomerAddressSchema } from "./schemas/customer-address.schema";
import { CustomerAddressesService } from "./customer-addresses.service";
import { CustomerAddressesController } from "./customer-addresses.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CustomerAddress.name, schema: CustomerAddressSchema },
    ]),
  ],
  controllers: [CustomerAddressesController],
  providers: [CustomerAddressesService],
  exports: [CustomerAddressesService],
})
export class CustomerAddressesModule {}
