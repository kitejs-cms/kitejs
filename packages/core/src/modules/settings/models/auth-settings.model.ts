export const AUTH_SETTINGS_KEY = "core:authentication";

export type AuthSettingsModel = {
  expiresIn: string;
  refreshTokensEnabled: boolean;
  refreshTokenExpiry?: string;
  allowedDomains?: string[];
  maxLoginAttempts?: number;
  loginAttemptResetTime?: string;
  cookieEnabled?: boolean;
  cookieName?: string;
  cookieHttpOnly?: boolean;
  cookieSecure?: boolean;
  cookieSameSite?: "strict" | "lax" | "none";
};
