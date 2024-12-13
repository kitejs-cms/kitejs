export type ApiResponse<T = unknown> = {
  status: "success" | "error";
  message?: string;
  data?: T;
  meta: {
    timestamp: string;
    [key: string]: any;
  };
};
