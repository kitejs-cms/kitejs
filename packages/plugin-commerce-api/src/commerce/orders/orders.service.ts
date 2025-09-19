import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";

import { Order, OrderDocument } from "./schemas/order.schema";
import { OrderItem } from "./schemas/order-item.schema";
import { OrderAddress } from "./schemas/order-address.schema";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { OrderStatus } from "./models/order-status.enum";
import { PaymentStatus } from "./models/payment-status.enum";
import { FulfillmentStatus } from "./models/fulfillment-status.enum";
import { OrderItemDto } from "./dto/order-item.dto";
import { OrderAddressDto } from "./dto/order-address.dto";

import type { OrderResponseModel } from "./models/order-response.model";
import type { OrderItemResponseModel } from "./models/order-item-response.model";
import type { User } from "@kitejs-cms/core";

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>
  ) {}

  private toObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid identifier provided: ${id}`);
    }

    return new Types.ObjectId(id);
  }

  private parseDate(value?: string): Date | undefined {
    if (!value) {
      return undefined;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid date provided: ${value}`);
    }

    return date;
  }

  private mapAddress(address?: OrderAddressDto): OrderAddress | undefined {
    if (!address) {
      return undefined;
    }

    return {
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company,
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      postalCode: address.postalCode,
      province: address.province,
      countryCode: address.countryCode,
      phone: address.phone,
    };
  }

  private mapOrderItems(items: OrderItemDto[]): OrderItem[] {
    return items.map((item) => ({
      title: item.title,
      variantTitle: item.variantTitle,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      currencyCode: item.currencyCode,
      productId: item.productId ? this.toObjectId(item.productId) : undefined,
      variantId: item.variantId ? this.toObjectId(item.variantId) : undefined,
      sku: item.sku,
      total: item.quantity * item.unitPrice,
    }));
  }

  private calculateOrderTotals(
    items: Array<Pick<OrderItem, "total">>,
    shippingTotal = 0,
    taxTotal = 0,
    discountTotal = 0
  ) {
    const subtotal = items.reduce((sum, item) => sum + (item.total ?? 0), 0);
    const total = subtotal + shippingTotal + taxTotal - discountTotal;

    return {
      subtotal,
      shippingTotal,
      taxTotal,
      discountTotal,
      total,
    };
  }

  private buildOrderQuery(
    filters?: Record<string, string>
  ): FilterQuery<OrderDocument> {
    const query: FilterQuery<OrderDocument> = {};

    if (!filters) {
      return query;
    }

    if (filters.status) {
      query.status = filters.status as OrderStatus;
    }

    if (filters.paymentStatus) {
      query.paymentStatus = filters.paymentStatus as PaymentStatus;
    }

    if (filters.fulfillmentStatus) {
      query.fulfillmentStatus = filters.fulfillmentStatus as FulfillmentStatus;
    }

    if (filters.customerId) {
      query.customer = this.toObjectId(filters.customerId);
    }

    if (filters.tags) {
      const tags = filters.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      if (tags.length > 0) {
        query.tags = { $in: tags } as FilterQuery<OrderDocument>["tags"];
      }
    }

    if (filters.search) {
      const searchTerm = filters.search.trim();

      if (searchTerm) {
        query.$or = [
          { orderNumber: { $regex: searchTerm, $options: "i" } },
          { email: { $regex: searchTerm, $options: "i" } },
          { notes: { $regex: searchTerm, $options: "i" } },
        ];
      }
    }

    return query;
  }

  private buildResponse(order: OrderDocument): OrderResponseModel {
    const rawCustomer = order.customer as Types.ObjectId | User | undefined;
    let customerId: string | undefined;
    let customerData: Record<string, unknown> | undefined;

    if (rawCustomer instanceof Types.ObjectId) {
      customerId = rawCustomer.toString();
    } else if (rawCustomer) {
      customerId = rawCustomer._id?.toString();
      customerData =
        typeof (rawCustomer as User).toJSON === "function"
          ? ((rawCustomer as User).toJSON() as Record<string, unknown>)
          : ({ ...(rawCustomer as Record<string, unknown>) } as Record<
              string,
              unknown
            >);
    }

    const json = order.toJSON();

    const items: OrderItemResponseModel[] = order.items.map((item) => ({
      id: item._id?.toString(),
      title: item.title,
      variantTitle: item.variantTitle,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      currencyCode: item.currencyCode,
      productId: item.productId ? item.productId.toString() : undefined,
      variantId: item.variantId ? item.variantId.toString() : undefined,
      sku: item.sku,
      total: item.total,
    }));

    return {
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      currencyCode: order.currencyCode,
      customerId,
      customer: customerData,
      email: order.email,
      billingAddress: json.billingAddress,
      shippingAddress: json.shippingAddress,
      items,
      subtotal: order.subtotal,
      shippingTotal: order.shippingTotal,
      taxTotal: order.taxTotal,
      discountTotal: order.discountTotal,
      total: order.total,
      notes: order.notes ?? undefined,
      tags: order.tags ?? [],
      paidAt: order.paidAt ?? undefined,
      fulfilledAt: order.fulfilledAt ?? undefined,
      cancelledAt: order.cancelledAt ?? undefined,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  async countOrders(filters?: Record<string, string>): Promise<number> {
    try {
      const query = this.buildOrderQuery(filters);
      return await this.orderModel.countDocuments(query).exec();
    } catch (error) {
      this.logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to count orders. ${message}`);
    }
  }

  async findOrders(
    skip = 0,
    take?: number,
    sort?: Record<string, 1 | -1>,
    filters?: Record<string, string>
  ): Promise<OrderResponseModel[]> {
    try {
      const query = this.buildOrderQuery(filters);
      const mongooseQuery = this.orderModel
        .find(query)
        .populate<{ customer?: User }>("customer")
        .sort(sort ?? { createdAt: -1 })
        .skip(skip);

      if (typeof take === "number" && take > 0) {
        mongooseQuery.limit(take);
      }

      const orders = await mongooseQuery.exec();
      return orders.map((order) => this.buildResponse(order));
    } catch (error) {
      this.logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to fetch orders. ${message}`);
    }
  }

  async findOrderById(id: string): Promise<OrderResponseModel> {
    try {
      const order = await this.orderModel
        .findById(id)
        .populate<{ customer?: User }>("customer")
        .exec();

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      return this.buildResponse(order);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to fetch order. ${message}`);
    }
  }

  async create(dto: CreateOrderDto): Promise<OrderResponseModel> {
    try {
      const items = this.mapOrderItems(dto.items);
      const shippingTotal = dto.shippingTotal ?? 0;
      const taxTotal = dto.taxTotal ?? 0;
      const discountTotal = dto.discountTotal ?? 0;
      const totals = this.calculateOrderTotals(
        items,
        shippingTotal,
        taxTotal,
        discountTotal
      );

      const order = await this.orderModel.create({
        orderNumber: dto.orderNumber,
        status: dto.status ?? OrderStatus.Pending,
        paymentStatus: dto.paymentStatus ?? PaymentStatus.Awaiting,
        fulfillmentStatus:
          dto.fulfillmentStatus ?? FulfillmentStatus.Unfulfilled,
        currencyCode: dto.currencyCode,
        customer: dto.customerId
          ? this.toObjectId(dto.customerId)
          : undefined,
        email: dto.email,
        billingAddress: this.mapAddress(dto.billingAddress),
        shippingAddress: this.mapAddress(dto.shippingAddress),
        items,
        subtotal: totals.subtotal,
        shippingTotal: totals.shippingTotal,
        taxTotal: totals.taxTotal,
        discountTotal: totals.discountTotal,
        total: totals.total,
        notes: dto.notes,
        tags: dto.tags ?? [],
        paidAt: this.parseDate(dto.paidAt),
        fulfilledAt: this.parseDate(dto.fulfilledAt),
        cancelledAt: this.parseDate(dto.cancelledAt),
      });

      return this.findOrderById(order._id.toString());
    } catch (error) {
      this.logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to create order. ${message}`);
    }
  }

  async update(
    id: string,
    dto: UpdateOrderDto
  ): Promise<OrderResponseModel> {
    try {
      const order = await this.orderModel.findById(id).exec();

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      if (dto.orderNumber !== undefined) {
        order.orderNumber = dto.orderNumber;
      }

      if (dto.status !== undefined) {
        order.status = dto.status;
      }

      if (dto.paymentStatus !== undefined) {
        order.paymentStatus = dto.paymentStatus;
      }

      if (dto.fulfillmentStatus !== undefined) {
        order.fulfillmentStatus = dto.fulfillmentStatus;
      }

      if (dto.currencyCode !== undefined) {
        order.currencyCode = dto.currencyCode;
      }

      if (dto.customerId !== undefined) {
        order.customer = dto.customerId
          ? this.toObjectId(dto.customerId)
          : undefined;
      }

      if (dto.email !== undefined) {
        order.email = dto.email;
      }

      if (dto.billingAddress !== undefined) {
        order.billingAddress = this.mapAddress(dto.billingAddress);
      }

      if (dto.shippingAddress !== undefined) {
        order.shippingAddress = this.mapAddress(dto.shippingAddress);
      }

      if (dto.items !== undefined) {
        order.items = this.mapOrderItems(dto.items);
      }

      if (dto.shippingTotal !== undefined) {
        order.shippingTotal = dto.shippingTotal ?? 0;
      }

      if (dto.taxTotal !== undefined) {
        order.taxTotal = dto.taxTotal ?? 0;
      }

      if (dto.discountTotal !== undefined) {
        order.discountTotal = dto.discountTotal ?? 0;
      }

      if (dto.notes !== undefined) {
        order.notes = dto.notes;
      }

      if (dto.tags !== undefined) {
        order.tags = dto.tags ?? [];
      }

      if (dto.paidAt !== undefined) {
        order.paidAt = this.parseDate(dto.paidAt);
      }

      if (dto.fulfilledAt !== undefined) {
        order.fulfilledAt = this.parseDate(dto.fulfilledAt);
      }

      if (dto.cancelledAt !== undefined) {
        order.cancelledAt = this.parseDate(dto.cancelledAt);
      }

      const totals = this.calculateOrderTotals(
        order.items,
        order.shippingTotal,
        order.taxTotal,
        order.discountTotal
      );

      order.subtotal = totals.subtotal;
      order.total = totals.total;

      await order.save();

      return this.findOrderById(order._id.toString());
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to update order. ${message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const order = await this.orderModel.findByIdAndDelete(id).exec();

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to delete order. ${message}`);
    }
  }
}
