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

interface SanitizedItem extends Omit<OrderItemDto, "productId" | "variantId"> {
  productId?: Types.ObjectId;
  variantId?: Types.ObjectId;
  total: number;
}

interface SanitizedItemsResult {
  items: SanitizedItem[];
  subtotal: number;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>
  ) {}

  private sanitizeAddress(address?: OrderAddressDto) {
    if (!address) return undefined;
    return { ...address };
  }

  private sanitizeItems(items: OrderItemDto[]): SanitizedItemsResult {
    const sanitized = items.map((item) => {
      const quantity = item.quantity;
      const unitPrice = item.unitPrice;
      const total = quantity * unitPrice;

      const sanitizedItem: SanitizedItem = {
        title: item.title,
        variantTitle: item.variantTitle,
        quantity,
        unitPrice,
        currencyCode: item.currencyCode,
        sku: item.sku,
        total,
      };

      if (item.productId) {
        sanitizedItem.productId = new Types.ObjectId(item.productId);
      }

      if (item.variantId) {
        sanitizedItem.variantId = new Types.ObjectId(item.variantId);
      }

      return sanitizedItem;
    });

    const subtotal = sanitized.reduce((sum, item) => sum + item.total, 0);

    return { items: sanitized, subtotal };
  }

  private calculateTotals(
    subtotal: number,
    shippingTotal?: number,
    taxTotal?: number,
    discountTotal?: number
  ) {
    const shipping = shippingTotal ?? 0;
    const tax = taxTotal ?? 0;
    const discount = discountTotal ?? 0;
    const total = Math.max(subtotal + shipping + tax - discount, 0);

    return {
      subtotal,
      shippingTotal: shipping,
      taxTotal: tax,
      discountTotal: discount,
      total,
    };
  }

  private toDate(value?: string) {
    return value ? new Date(value) : undefined;
  }

  private toAddressModel(
    address?: Record<string, unknown>
  ): OrderAddressModel | undefined {
    if (!address) return undefined;

    return {
      firstName: (address.firstName as string | undefined) ?? undefined,
      lastName: (address.lastName as string | undefined) ?? undefined,
      company: (address.company as string | undefined) ?? undefined,
      address1: address.address1 as string,
      address2: (address.address2 as string | undefined) ?? undefined,
      city: address.city as string,
      postalCode: (address.postalCode as string | undefined) ?? undefined,
      province: (address.province as string | undefined) ?? undefined,
      countryCode: address.countryCode as string,
      phone: (address.phone as string | undefined) ?? undefined,
    };
  }

  private toItemModel(item: Record<string, unknown>): OrderItemResponseModel {
    const idValue = item._id ?? item.id;
    const productId = item.productId as Types.ObjectId | string | undefined;
    const variantId = item.variantId as Types.ObjectId | string | undefined;

    return {
      id:
        typeof idValue === "string"
          ? idValue
          : idValue instanceof Types.ObjectId
            ? idValue.toString()
            : undefined,
      title: item.title as string,
      variantTitle: (item.variantTitle as string | undefined) ?? undefined,
      quantity: Number(item.quantity ?? 0),
      unitPrice: Number(item.unitPrice ?? 0),
      currencyCode: item.currencyCode as string,
      productId:
        typeof productId === "string"
          ? productId
          : productId instanceof Types.ObjectId
            ? productId.toString()
            : undefined,
      variantId:
        typeof variantId === "string"
          ? variantId
          : variantId instanceof Types.ObjectId
            ? variantId.toString()
            : undefined,
      sku: (item.sku as string | undefined) ?? undefined,
      total: Number(item.total ?? 0),
    };
  }

  private toResponse(order: OrderDocument): OrderResponseModel {
    const json = order.toJSON() as Record<string, unknown>;
    const tags = (json.tags as string[] | undefined) ?? order.tags ?? [];

    const customer = json.customer;
    let customerId: string | undefined;
    let customerData: Record<string, unknown> | undefined;

    if (typeof customer === "string") {
      customerId = customer;
    } else if (customer && typeof customer === "object") {
      const objectCustomer = customer as Record<string, unknown>;
      const idValue = objectCustomer._id ?? objectCustomer.id;

      if (typeof idValue === "string") {
        customerId = idValue;
      } else if (idValue instanceof Types.ObjectId) {
        customerId = idValue.toString();
      }

      customerData = objectCustomer;
    }

    const persistedItems = order.items ?? [];

    const items = Array.isArray(json.items)
      ? (json.items as Record<string, unknown>[]).map((item) =>
          this.toItemModel(item)
        )
      : persistedItems.map((item) =>
          this.toItemModel(
            typeof item.toJSON === "function"
              ? (item.toJSON() as Record<string, unknown>)
              : (item as unknown as Record<string, unknown>)
          )
        );

    const billingAddressJson =
      (json.billingAddress as Record<string, unknown> | undefined) ??
      (order.billingAddress && typeof order.billingAddress.toJSON === "function"
        ? (order.billingAddress.toJSON() as Record<string, unknown>)
        : ((order.billingAddress as unknown) as Record<string, unknown> | undefined));

    const shippingAddressJson =
      (json.shippingAddress as Record<string, unknown> | undefined) ??
      (order.shippingAddress && typeof order.shippingAddress.toJSON === "function"
        ? (order.shippingAddress.toJSON() as Record<string, unknown>)
        : ((order.shippingAddress as unknown) as Record<string, unknown> | undefined));

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
      billingAddress: this.toAddressModel(billingAddressJson),
      shippingAddress: this.toAddressModel(shippingAddressJson),
      items,
      subtotal: order.subtotal,
      shippingTotal: order.shippingTotal,
      taxTotal: order.taxTotal,
      discountTotal: order.discountTotal,
      total: order.total,
      notes: order.notes,
      tags,
      paidAt: order.paidAt ?? undefined,
      fulfilledAt: order.fulfilledAt ?? undefined,
      cancelledAt: order.cancelledAt ?? undefined,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  async create(dto: CreateOrderDto): Promise<OrderResponseModel> {
    const {
      customerId,
      billingAddress,
      shippingAddress,
      items,
      paidAt,
      fulfilledAt,
      cancelledAt,
      ...rest
    } = dto;

    const sanitizedItems = this.sanitizeItems(items);
    const totals = this.calculateTotals(
      sanitizedItems.subtotal,
      dto.shippingTotal,
      dto.taxTotal,
      dto.discountTotal
    );

    const created = await this.orderModel.create({
      ...rest,
      status: rest.status ?? OrderStatus.Pending,
      paymentStatus: rest.paymentStatus ?? PaymentStatus.Awaiting,
      fulfillmentStatus:
        rest.fulfillmentStatus ?? FulfillmentStatus.Unfulfilled,
      customer: customerId ? new Types.ObjectId(customerId) : undefined,
      items: sanitizedItems.items,
      subtotal: totals.subtotal,
      shippingTotal: totals.shippingTotal,
      taxTotal: totals.taxTotal,
      discountTotal: totals.discountTotal,
      total: totals.total,
      billingAddress: this.sanitizeAddress(billingAddress),
      shippingAddress: this.sanitizeAddress(shippingAddress),
      tags: rest.tags ?? [],
      paidAt: this.toDate(paidAt),
      fulfilledAt: this.toDate(fulfilledAt),
      cancelledAt: this.toDate(cancelledAt),
    });

    await created.populate("customer");

    return this.toResponse(created);
  }

  async findAll(): Promise<OrderResponseModel[]> {
    const orders = await this.orderModel
      .find()
      .sort({ createdAt: -1 })
      .populate("customer")
      .exec();

    return orders.map((order) => this.toResponse(order));
  }

  async findOne(id: string): Promise<OrderResponseModel> {
    const order = await this.orderModel
      .findById(id)
      .populate("customer")
      .exec();

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return this.toResponse(order);
  }

  async update(id: string, dto: UpdateOrderDto): Promise<OrderResponseModel> {
    const {
      customerId,
      billingAddress,
      shippingAddress,
      items,
      paidAt,
      fulfilledAt,
      cancelledAt,
      ...rest
    } = dto;

    const updateData: Record<string, unknown> = {
      ...rest,
    };

    if (customerId !== undefined) {
      updateData.customer = customerId ? new Types.ObjectId(customerId) : null;
    }

    if (billingAddress !== undefined) {
      updateData.billingAddress = this.sanitizeAddress(billingAddress);
    }

    if (shippingAddress !== undefined) {
      updateData.shippingAddress = this.sanitizeAddress(shippingAddress);
    }

    let subtotalFromItems: number | undefined;

    if (items) {
      const sanitizedItems = this.sanitizeItems(items);
      updateData.items = sanitizedItems.items;
      subtotalFromItems = sanitizedItems.subtotal;
    }

    if (paidAt !== undefined) {
      updateData.paidAt = paidAt ? new Date(paidAt) : null;
    }

    if (fulfilledAt !== undefined) {
      updateData.fulfilledAt = fulfilledAt ? new Date(fulfilledAt) : null;
    }

    if (cancelledAt !== undefined) {
      updateData.cancelledAt = cancelledAt ? new Date(cancelledAt) : null;
    }

    const shouldRecalculateTotals =
      items !== undefined ||
      dto.shippingTotal !== undefined ||
      dto.taxTotal !== undefined ||
      dto.discountTotal !== undefined;

    if (shouldRecalculateTotals) {
      const existing =
        items !== undefined
          ? undefined
          : await this.orderModel
              .findById(id)
              .select("subtotal shippingTotal taxTotal discountTotal")
              .lean();

      const baseSubtotal =
        subtotalFromItems !== undefined
          ? subtotalFromItems
          : (existing?.subtotal ?? 0);
      const shippingTotal =
        dto.shippingTotal !== undefined
          ? dto.shippingTotal
          : (existing?.shippingTotal ?? 0);
      const taxTotal =
        dto.taxTotal !== undefined ? dto.taxTotal : (existing?.taxTotal ?? 0);
      const discountTotal =
        dto.discountTotal !== undefined
          ? dto.discountTotal
          : (existing?.discountTotal ?? 0);

      const totals = this.calculateTotals(
        baseSubtotal,
        shippingTotal,
        taxTotal,
        discountTotal
      );

      updateData.subtotal = totals.subtotal;
      updateData.shippingTotal = totals.shippingTotal;
      updateData.taxTotal = totals.taxTotal;
      updateData.discountTotal = totals.discountTotal;
      updateData.total = totals.total;
    }

    const order = await this.orderModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate("customer")
      .exec();

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return this.toResponse(order);
  }

  async remove(id: string): Promise<void> {
    const result = await this.orderModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
  }
}
