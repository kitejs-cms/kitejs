import { Package, ShoppingCart, Truck } from "lucide-react";
import type { DashboardModule } from "@kitejs-cms/dashboard-core";
import { CommerceSettings } from "./components/commerce-settings";
import { CommerceProductsPage } from "./pages/commerce-products";
import { CommerceProductDetailsPage } from "./pages/commerce-product-details";
import { CommerceOrdersPage } from "./pages/commerce-orders";
import { CommerceOrderDetailsPage } from "./pages/commerce-order-details";
import { COMMERCE_PLUGIN_NAMESPACE } from "./constants";

/* i18n */
import en from "./locales/en.json";
import it from "./locales/it.json";

export const CommerceModule: DashboardModule = {
  key: COMMERCE_PLUGIN_NAMESPACE,
  name: "commerce",
  translations: { en, it },
  settings: {
    key: COMMERCE_PLUGIN_NAMESPACE,
    title: "commerce:menu.commerce",
    icon: <ShoppingCart />,
    description: "commerce:settings.description",
    children: [
      {
        key: "commerce-settings",
        title: "commerce:settings.general",
        icon: <Package />,
        component: <CommerceSettings />,
      },
    ],
  },
  routes: [
    {
      path: "commerce/products",
      element: <CommerceProductsPage />,
      label: "commerce:menu.products",
      requiredPermissions: ["plugin-commerce:products.read"],
    },
    {
      path: "commerce/products/new",
      element: <CommerceProductDetailsPage />,
      label: "",
      requiredPermissions: ["plugin-commerce:products.create"],
    },
    {
      path: "commerce/products/:id",
      element: <CommerceProductDetailsPage />,
      label: "",
      requiredPermissions: ["plugin-commerce:products.read"],
    },
    {
      path: "commerce/orders",
      element: <CommerceOrdersPage />,
      label: "commerce:menu.orders",
      requiredPermissions: ["plugin-commerce:orders.read"],
    },
    {
      path: "commerce/orders/:id",
      element: <CommerceOrderDetailsPage />,
      label: "",
      requiredPermissions: ["plugin-commerce:orders.read"],
    },
  ],
  menuItem: {
    title: "commerce:menu.commerce",
    icon: ShoppingCart,
    requiredPermissions: [
      "plugin-commerce:products.read",
      "plugin-commerce:orders.read",
    ],
    items: [
      {
        url: "/commerce/products",
        title: "commerce:menu.products",
        icon: Package,
        requiredPermissions: ["plugin-commerce:products.read"],
      },
      {
        url: "/commerce/orders",
        title: "commerce:menu.orders",
        icon: Truck,
        requiredPermissions: ["plugin-commerce:orders.read"],
      },
    ],
  },
};
