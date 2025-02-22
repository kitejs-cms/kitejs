import { UserStatus } from "./user-status.enum";

export type UserResponseModel = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  roles: string[];
  permissions: string[];
  loginAttempts?: string | null;
  password?: string;
};
