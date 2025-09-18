import type { OrderItemModel } from "./order-item.model";

export type OrderItemResponseModel = OrderItemModel & {
  id?: string;
  total: number;
};
