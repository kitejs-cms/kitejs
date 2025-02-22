import { UserResponseModel } from "./user-response.model";

export type UpdateUserModel = Partial<
  Omit<UserResponseModel, "roles" | "permissions">
>;
