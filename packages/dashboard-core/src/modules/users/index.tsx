import { DashboardModule } from "../../models/module.model";

import { Shield, UserPlus, Users, UsersIcon } from "lucide-react";
import { UsersManagePage } from "./pages/users-manage";

export const UsersModule: DashboardModule = {
  name: "users",
  routes: [
    {
      path: "users",
      element: <UsersManagePage />,
      label: "users:menu.usersList",
      icon: <UsersIcon />,
    },
  ],
  menuItem: {
    title: "users:menu.users",
    icon: Users,
    items: [
      {
        title: "users:title.manageUsers",
        url: "/users",
        icon: UserPlus,
      },
      {
        title: "users:title.manageRoles",
        url: "/users/roles",
        icon: Shield,
      },
    ],
  },
};
