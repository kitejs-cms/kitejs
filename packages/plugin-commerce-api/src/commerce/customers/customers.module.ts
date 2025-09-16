import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Customer, CustomerSchema } from "./schemas/customer.schema";
import { CustomersService } from "./services/customers.service";
import { CustomersController } from "./controllers/customers.controller";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }]),
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
