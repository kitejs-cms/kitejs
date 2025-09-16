import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Order, OrderDocument } from "../schemas/order.schema";
import { CreateOrderDto, OrderAddressDto, OrderItemDto } from "../dto/create-order.dto";
import { UpdateOrderDto } from "../dto/update-order.dto";
import { OrderStatus } from "../models/order-status.enum";
import { PaymentStatus } from "../models/payment-status.enum";
import { FulfillmentStatus } from "../models/fulfillment-status.enum";

type SanitizedItemsResult = {
  items: Array<
    Omit<OrderItemDto, "productId" | "variantId" | "metadata"> & {
      productId?: Types.ObjectId;
      variantId?: Types.ObjectId;
      metadata: Record<string, any>;
      total: number;
    }
  >;
  subtotal: number;
};

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

      const sanitizedItem: SanitizedItemsResult["items"][number] = {
        title: item.title,
        variantTitle: item.variantTitle,
        quantity,
        unitPrice,
        currencyCode: item.currencyCode,
        sku: item.sku,
        metadata: item.metadata ?? {},
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

  async create(dto: CreateOrderDto): Promise<OrderDocument> {
    const {
      customerId,
      billingAddress,
      shippingAddress,
      items,
      metadata,
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

    return this.orderModel.create({
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
      metadata: metadata ?? {},
      tags: rest.tags ?? [],
      paidAt: this.toDate(paidAt),
      fulfilledAt: this.toDate(fulfilledAt),
      cancelledAt: this.toDate(cancelledAt),
    });
  }

  async findAll(): Promise<OrderDocument[]> {
    return this.orderModel.find().sort({ createdAt: -1 }).populate("customer").exec();
  }

  async findOne(id: string): Promise<OrderDocument> {
    const order = await this.orderModel
      .findById(id)
      .populate("customer")
      .exec();

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async update(id: string, dto: UpdateOrderDto): Promise<OrderDocument> {
    const {
      customerId,
      billingAddress,
      shippingAddress,
      items,
      metadata,
      paidAt,
      fulfilledAt,
      cancelledAt,
      ...rest
    } = dto;

    const updateData: Record<string, unknown> = {
      ...rest,
    };

    if (customerId !== undefined) {
      updateData.customer = customerId
        ? new Types.ObjectId(customerId)
        : null;
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

    if (metadata) {
      updateData.metadata = metadata;
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
          : existing?.subtotal ?? 0;
      const shippingTotal =
        dto.shippingTotal !== undefined
          ? dto.shippingTotal
          : existing?.shippingTotal ?? 0;
      const taxTotal =
        dto.taxTotal !== undefined ? dto.taxTotal : existing?.taxTotal ?? 0;
      const discountTotal =
        dto.discountTotal !== undefined
          ? dto.discountTotal
          : existing?.discountTotal ?? 0;

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

    return order;
  }

  async remove(id: string): Promise<void> {
    const result = await this.orderModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
  }
}
