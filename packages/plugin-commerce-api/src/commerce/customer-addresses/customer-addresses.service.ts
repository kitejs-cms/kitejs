import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  CustomerAddress,
  CustomerAddressDocument,
} from "./schemas/customer-address.schema";
import { CreateCustomerAddressDto } from "./dto/create-customer-address.dto";
import { UpdateCustomerAddressDto } from "./dto/update-customer-address.dto";
import type { CustomerAddressResponseModel } from "./models/customer-address-response.model";

@Injectable()
export class CustomerAddressesService {
  constructor(
    @InjectModel(CustomerAddress.name)
    private readonly addressModel: Model<CustomerAddressDocument>
  ) {}
}
