import { FulfillmentStatus } from "./fulfillment-status.enum";
import { OrderStatus } from "./order-status.enum";
import { PaymentStatus } from "./payment-status.enum";

export type OrderAddressModel = {
  firstName?: string;
  lastName?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  postalCode?: string;
  province?: string;
  countryCode: string;
  phone?: string;
};

export type OrderItemModel = {
  title: string;
  variantTitle?: string;
  quantity: number;
  unitPrice: number;
  currencyCode: string;
  productId?: string;
  variantId?: string;
  sku?: string;
};

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
