import {
  FieldDefinition,
  PermissionModel,
  SettingModel,
} from "@kitejs-cms/core";

export const COMMERCE_PLUGIN_NAMESPACE = "commerce-plugin";
export const COMMERCE_PRODUCT_SLUG_NAMESPACE = `${COMMERCE_PLUGIN_NAMESPACE}:products`;
export const COMMERCE_COLLECTION_SLUG_NAMESPACE = `${COMMERCE_PLUGIN_NAMESPACE}:collections`;

export const CommercePermissions: PermissionModel[] = [
  {
    name: `${COMMERCE_PLUGIN_NAMESPACE}:products.read`,
    description: "Permission to view products",
    role: ["admin", "editor", "viewer"],
  },
  {
    name: `${COMMERCE_PLUGIN_NAMESPACE}:products.create`,
    description: "Permission to create products",
    role: ["admin", "editor"],
  },
  {
    name: `${COMMERCE_PLUGIN_NAMESPACE}:products.update`,
    description: "Permission to update products",
    role: ["admin", "editor"],
  },
  {
    name: `${COMMERCE_PLUGIN_NAMESPACE}:products.delete`,
    description: "Permission to delete products",
    role: ["admin"],
  },
  {
    name: `${COMMERCE_PLUGIN_NAMESPACE}:collections.read`,
    description: "Permission to view product collections",
    role: ["admin", "editor", "viewer"],
  },
  {
    name: `${COMMERCE_PLUGIN_NAMESPACE}:collections.create`,
    description: "Permission to create product collections",
    role: ["admin", "editor"],
  },
  {
    name: `${COMMERCE_PLUGIN_NAMESPACE}:collections.update`,
    description: "Permission to update product collections",
    role: ["admin", "editor"],
  },
  {
    name: `${COMMERCE_PLUGIN_NAMESPACE}:collections.delete`,
    description: "Permission to delete product collections",
    role: ["admin"],
  },
  {
    name: `${COMMERCE_PLUGIN_NAMESPACE}:customers.read`,
    description: "Permission to view customers",
    role: ["admin", "editor", "viewer"],
  },
  {
    name: `${COMMERCE_PLUGIN_NAMESPACE}:customers.create`,
    description: "Permission to create customers",
    role: ["admin", "editor"],
  },
  {
    name: `${COMMERCE_PLUGIN_NAMESPACE}:customers.update`,
    description: "Permission to update customers",
    role: ["admin", "editor"],
  },
  {
    name: `${COMMERCE_PLUGIN_NAMESPACE}:customers.delete`,
    description: "Permission to delete customers",
    role: ["admin"],
  },
  {
    name: `${COMMERCE_PLUGIN_NAMESPACE}:orders.read`,
    description: "Permission to view orders",
    role: ["admin", "editor", "viewer"],
  },
  {
    name: `${COMMERCE_PLUGIN_NAMESPACE}:orders.create`,
    description: "Permission to create orders",
    role: ["admin", "editor"],
  },
  {
    name: `${COMMERCE_PLUGIN_NAMESPACE}:orders.update`,
    description: "Permission to update orders",
    role: ["admin", "editor"],
  },
  {
    name: `${COMMERCE_PLUGIN_NAMESPACE}:orders.delete`,
    description: "Permission to delete orders",
    role: ["admin"],
  },
];

export const COMMERCE_SETTINGS_KEY = `${COMMERCE_PLUGIN_NAMESPACE}:settings`;

export type CommercePluginSettingsModel = {
  defaultCurrency: string;
  allowGuestCheckout: boolean;
  taxInclusivePricing: boolean;
  customProductFields?: FieldDefinition[];
  customCustomerFields?: FieldDefinition[];
};

export const CommerceSetting: SettingModel<CommercePluginSettingsModel>[] = [
  {
    key: COMMERCE_SETTINGS_KEY,
    value: {
      defaultCurrency: "EUR",
      allowGuestCheckout: true,
      taxInclusivePricing: false,
      customProductFields: [],
      customCustomerFields: [],
    },
  },
];
