import { ProductResponseModel } from "./product-response.model";

export type ProductUpsertModel = Omit<
  ProductResponseModel,
  "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
> & {
  id?: string;
};
