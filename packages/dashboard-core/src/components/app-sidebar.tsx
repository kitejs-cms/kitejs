import * as React from "react";
import {
  Command,
  LayoutDashboard,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";
import { NavMain } from "../components/nav-main";
import { NavUser } from "../components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../components/ui/sidebar";
import { useAuthContext } from "../context/auth-context";

const items = [
  {
    title: "Main Menu",
    items: [
      {
        title: "Dashboard",
        url: "#dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Users",
        url: "#users",
        icon: Users,
        items: [
          {
            title: "Manage Users",
            url: "/users/manage",
            icon: UserPlus,
          },
          {
            title: "Manage Roles",
            url: "/users/roles",
            icon: Shield,
          },
        ],
      },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthContext();

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Acme Inc</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {items.map((group, index) => (
          <NavMain key={index} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: `${user?.firstName} ${user?.lastName}`,
            email: user?.email,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
