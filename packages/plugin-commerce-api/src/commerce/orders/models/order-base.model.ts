import type { FulfillmentStatus } from "./fulfillment-status.enum";
import type { OrderStatus } from "./order-status.enum";
import type { PaymentStatus } from "./payment-status.enum";
import type { OrderAddressModel } from "./order-address.model";
import type { OrderItemModel } from "./order-item.model";

export type OrderBaseModel = {
  orderNumber: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  currencyCode: string;
  customerId?: string;
  email?: string;
  billingAddress?: OrderAddressModel;
  shippingAddress?: OrderAddressModel;
  items: OrderItemModel[];
  shippingTotal?: number;
  taxTotal?: number;
  discountTotal?: number;
  notes?: string;
  tags?: string[];
  paidAt?: string;
  fulfilledAt?: string;
  cancelledAt?: string;
};
