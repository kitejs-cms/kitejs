import { DashboardModule } from "../../models/module.model";

import { UserPlus, Users, UsersIcon } from "lucide-react";
import { UsersManagePage } from "./pages/users-manage";

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
      //{
      //  title: "users:title.manageRoles",
      //  url: "/users/roles",
      //  icon: Shield,
      //},
    ],
  },
  //settings: {
  //  key: "users",
  //  title: "users:settings.title",
  //  icon: <Users />,
  //  description: "users:settings.description",
  //  component: <div>Main</div>,
  //  children: [
  //    {
  //      key: "users-management",
  //      title: "users:settings.usersManagement",
  //      icon: <UserPlus />,
  //      component: <div>TEST</div>,
  //    },
  //    {
  //      key: "roles",
  //      title: "users:settings.roles",
  //      icon: <Shield />,
  //      component: <div>TEST2</div>,
  //    },
  //  ],
  //},
};
