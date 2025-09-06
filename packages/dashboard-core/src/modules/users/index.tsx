import { DashboardModule } from "../../models/module.model";

import { UserPlus, Users, UsersIcon, Shield } from "lucide-react";
import { UsersManagePage } from "./pages/users-manage";
import { RolesManagePage } from "./pages/roles-manage";
import { UserProfilePage } from "./pages/user-profile";
import { UserGeneralSettings } from "./components/user-general-settings";
import { UserConsentSettings } from "./components/user-consents-settings";

export const UsersModule: DashboardModule = {
  name: "users",
  key: "users",
  routes: [
    {
      path: "users",
      element: <UsersManagePage />,
      label: "users:menu.usersList",
      icon: <UsersIcon />,
      requiredPermissions: ["core:users.read"],
    },
    {
      path: "users/:id",
      element: <UserProfilePage />,
      label: "users:menu.usersList",
      requiredPermissions: ["core:users.read"],
    },
    {
      path: "users/roles",
      element: <RolesManagePage />,
      label: "users:title.manageRoles",
      icon: <Shield />,
    },
  ],
  menuItem: {
    title: "users:menu.users",
    icon: Users,
    requiredPermissions: ["core:users.read"],
    items: [
      {
        title: "users:title.manageUsers",
        url: "/users",
        icon: UserPlus,
        requiredPermissions: ["core:users.read"],
      },
      {
        title: "users:title.manageRoles",
        url: "/users/roles",
        icon: Shield,
      },
    ],
  },
  settings: {
    key: "users",
    title: "users:settings.menu.title",
    icon: <Users />,
    description: "users:settings.menu.description",
    children: [
      {
        key: "general",
        title: "users:settings.general.title",
        component: <UserGeneralSettings />,
      },
      {
        key: "consents",
        title: "users:settings.consents.title",
        component: <UserConsentSettings />,
      },
    ],
  },
};
