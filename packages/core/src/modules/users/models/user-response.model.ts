import { UserStatus } from "./user-status.enum";

export type UserResponseModel = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  roles: string[];
  permissions: string[];
  consents?: Array<{
    consentType: string;
    given: boolean;
    timestamp: string;
  }>;
  loginAttempts?: string | null;
  password?: string;
  createdAt: string;
  updatedAt: string;
};
