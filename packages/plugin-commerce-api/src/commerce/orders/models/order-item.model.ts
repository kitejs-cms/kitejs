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
