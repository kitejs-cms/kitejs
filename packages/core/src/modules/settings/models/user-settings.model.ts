export const USER_SETTINGS_KEY = "core:users";

export type UserSettingsModel = {
  registrationOpen: boolean;
  defaultRole: string;
  consentsEnabled: boolean;
  consents: Array<{
    name: string;
    slug: string;
    description?: string;
    required: boolean;
  }>;
};
