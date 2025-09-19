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
    if (!filters) {
      return {};
    }

    const { search, status, paymentStatus, fulfillmentStatus, customerId, tags } =
      filters;

    const tagValues = tags
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const trimmedSearch = search?.trim();

    return {
      ...(status ? { status: status as OrderStatus } : {}),
      ...(paymentStatus
        ? { paymentStatus: paymentStatus as PaymentStatus }
        : {}),
      ...(fulfillmentStatus
        ? { fulfillmentStatus: fulfillmentStatus as FulfillmentStatus }
        : {}),
      ...(customerId ? { customer: this.toObjectId(customerId) } : {}),
      ...(tagValues?.length
        ? ({ tags: { $in: tagValues } } as FilterQuery<OrderDocument>)
        : {}),
      ...(trimmedSearch
        ? {
            $or: [
              { orderNumber: { $regex: trimmedSearch, $options: "i" } },
              { email: { $regex: trimmedSearch, $options: "i" } },
              { notes: { $regex: trimmedSearch, $options: "i" } },
            ],
          }
        : {}),
    };
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
        shippingTotal,
        taxTotal,
        discountTotal,
        total: totals.total,
        notes: dto.notes,
        tags: dto.tags ?? [],
        paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
        fulfilledAt: dto.fulfilledAt ? new Date(dto.fulfilledAt) : undefined,
        cancelledAt: dto.cancelledAt ? new Date(dto.cancelledAt) : undefined,
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

      const items = dto.items
        ? this.mapOrderItems(dto.items)
        : order.items;
      const shippingTotal = dto.shippingTotal ?? order.shippingTotal;
      const taxTotal = dto.taxTotal ?? order.taxTotal;
      const discountTotal = dto.discountTotal ?? order.discountTotal;

      const totals = this.calculateOrderTotals(
        items,
        shippingTotal,
        taxTotal,
        discountTotal
      );

      const updatePayload: Partial<Order> = {
        ...(dto.orderNumber !== undefined ? { orderNumber: dto.orderNumber } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.paymentStatus !== undefined
          ? { paymentStatus: dto.paymentStatus }
          : {}),
        ...(dto.fulfillmentStatus !== undefined
          ? { fulfillmentStatus: dto.fulfillmentStatus }
          : {}),
        ...(dto.currencyCode !== undefined
          ? { currencyCode: dto.currencyCode }
          : {}),
        ...(dto.customerId !== undefined
          ? {
              customer: dto.customerId
                ? this.toObjectId(dto.customerId)
                : undefined,
            }
          : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.tags !== undefined ? { tags: dto.tags ?? [] } : {}),
        ...(dto.billingAddress !== undefined
          ? { billingAddress: this.mapAddress(dto.billingAddress) }
          : {}),
        ...(dto.shippingAddress !== undefined
          ? { shippingAddress: this.mapAddress(dto.shippingAddress) }
          : {}),
        ...(dto.items !== undefined ? { items } : {}),
        shippingTotal,
        taxTotal,
        discountTotal,
        subtotal: totals.subtotal,
        total: totals.total,
        ...(dto.paidAt !== undefined
          ? { paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined }
          : {}),
        ...(dto.fulfilledAt !== undefined
          ? { fulfilledAt: dto.fulfilledAt ? new Date(dto.fulfilledAt) : undefined }
          : {}),
        ...(dto.cancelledAt !== undefined
          ? {
              cancelledAt: dto.cancelledAt
                ? new Date(dto.cancelledAt)
                : undefined,
            }
          : {}),
      };

      Object.assign(order, updatePayload);

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
