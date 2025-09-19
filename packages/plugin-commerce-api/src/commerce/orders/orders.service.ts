import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Order, OrderDocument } from "./schemas/order.schema";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { OrderStatus } from "./models/order-status.enum";
import { PaymentStatus } from "./models/payment-status.enum";
import { FulfillmentStatus } from "./models/fulfillment-status.enum";
import { OrderAddressDto } from "./dto/order-address.dto";
import { OrderItemDto } from "./dto/order-item.dto";
import type { OrderAddressModel } from "./models/order-address.model";
import type { OrderItemResponseModel } from "./models/order-item-response.model";
import type { OrderResponseModel } from "./models/order-response.model";
@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>
  ) {}
}
