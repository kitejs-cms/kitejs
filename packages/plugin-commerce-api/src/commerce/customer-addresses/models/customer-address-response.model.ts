import type { CustomerAddressBaseModel } from "./customer-address-base.model";

export type CustomerAddressResponseModel = CustomerAddressBaseModel & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};
