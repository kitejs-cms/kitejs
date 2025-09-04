import { PermissionModel } from "./modules/users/models/permission.model";
import {
  AUTH_SETTINGS_KEY,
  CACHE_SETTINGS_KEY,
  SWAGGER_SETTINGS_KEY,
  STORAGE_SETTINGS_KEY,
  SettingModel,
} from "./modules/settings";
import {
  ARTICLE_SETTINGS_KEY,
  PAGE_SETTINGS_KEY,
} from "./modules/settings/models/article-settings.models";
import { FilterFieldConfig, FilterView } from "./common";
import { PageStatus } from "./modules/pages/models/page-status.enum";

const PageFilterFields: FilterFieldConfig[] = [
  {
    key: "tags",
    label: "Tags",
    type: "array",
    operators: ["in", "nin", "contains"],
    placeholder: "Filter by tags",
  },
  {
    key: "publishAt",
    label: "Publish Date",
    type: "date",
    operators: ["equals", "ne", "gt", "gte", "lt", "lte", "exists"],
    placeholder: "Filter by publish date",
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    operators: ["equals", "ne", "in", "nin"],
    options: [
      { value: "Published", label: "Published" },
      { value: "Draft", label: "Draft" },
      { value: "Archived", label: "Archived" },
    ],
    placeholder: "Filter by status",
  },
];

const PageViews: FilterView[] = [
  {
    id: "published",
    name: "Published Pages",
    description: "Pages that are currently published",
    conditions: [
      {
        id: "status-published",
        field: "status",
        operator: "equals",
        value: PageStatus.Published,
      },
    ],
  },
  {
    id: "drafts",
    name: "Draft Pages",
    description: "Pages in draft status",
    conditions: [
      {
        id: "status-draft",
        field: "status",
        operator: "equals",
        value: PageStatus.Draft,
      },
    ],
  },
  {
    id: "archived",
    name: "Archived Pages",
    description: "Pages in archived status",
    conditions: [
      {
        id: "status-archived",
        field: "status",
        operator: "equals",
        value: PageStatus.Archived,
      },
    ],
  },
];

export const CORE_NAMESPACE = "core";

export const CoreRoles = ["admin", "editor", "viewer"] as const;

export const CorePermissions: PermissionModel[] = [
  /* Users */
  {
    name: "core:users.read",
    description: "Permission to view user data",
    role: ["admin", "editor", "viewer"],
  },
  {
    name: "core:users.create",
    description: "Permission to create new users",
    role: ["admin", "editor"],
  },
  {
    name: "core:users.update",
    description: "Permission to update existing user data",
    role: ["admin", "editor"],
  },
  {
    name: "core:users.delete",
    description: "Permission to delete users",
    role: ["admin"],
  },
  /* Settings */
  {
    name: "core:settings.read",
    description: "Permission to view system settings",
    role: ["admin", "editor"],
  },
  {
    name: "core:settings.update",
    description: "Permission to update system settings",
    role: ["admin"],
  },
  /* Roles */
  {
    name: "core:roles.read",
    description: "Permission to view existing roles",
    role: ["admin", "editor"],
  },
  {
    name: "core:roles.create",
    description: "Permission to create new roles",
    role: ["admin"],
  },
  {
    name: "core:roles.update",
    description: "Permission to update existing roles",
    role: ["admin"],
  },
  {
    name: "core:roles.delete",
    description: "Permission to delete roles",
    role: ["admin"],
  },
];

export const CoreSetting: SettingModel[] = [
  {
    key: AUTH_SETTINGS_KEY,
    value: {
      expiresIn: "1h",
      refreshTokensEnabled: true,
      refreshTokenExpiry: "12h",
      allowedDomains: [] as string[],
      maxLoginAttempts: 5,
      loginAttemptResetTime: "15m",
      cookieName: "session",
      cookieHttpOnly: true,
      cookieSecure: false,
      cookieSameSite: "strict",
      cookieEnabled: true,
    },
  },
  {
    key: CACHE_SETTINGS_KEY,
    value: { ttl: 3600, enabled: true },
  },
  {
    key: SWAGGER_SETTINGS_KEY,
    value: {
      enabled: true,
      title: "CMS API",
      description: "API documentation for the CMS",
      version: "1.0",
      path: "api-docs",
    },
  },
  {
    key: STORAGE_SETTINGS_KEY,
    value: {
      provider: "local",
      local: { uploadPath: "assets" },
    },
  },
  {
    key: ARTICLE_SETTINGS_KEY,
    value: {
      customFields: [],
      filterFields: PageFilterFields,
      views: PageViews,
    },
  },
  {
    key: PAGE_SETTINGS_KEY,
    value: { filterFields: PageFilterFields, views: PageViews },
  },
];
