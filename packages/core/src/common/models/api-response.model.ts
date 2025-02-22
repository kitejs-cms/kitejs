import { PaginationModel } from "./pagination.model";

export type MetaModel = {
  timestamp: string;
  query?: Record<string, unknown>;
  [key: string]: any;
  pagination?: PaginationModel;
};

export type ApiResponse<T = unknown> = {
  status: "success" | "error";
  message?: string;
  data?: T;
  meta: MetaModel;
};
