import * as React from "react";
import { Command, LayoutDashboard } from "lucide-react";
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
import { SidebarMenuItem as ItemModule } from "../models/module.model";

export function AppSidebar({
  items = [],
  openSettings,
  ...sidebarProps
}: React.ComponentProps<typeof Sidebar> & {
  items?: ItemModule[];
  openSettings?: () => void;
}) {
  const { user } = useAuthContext();

  const allItems = [
    {
      title: "Main Menu",
      items: [
        {
          title: "Dashboard",
          url: "#dashboard",
          icon: LayoutDashboard,
        },
        ...items,
      ],
    },
  ];

  return (
    <Sidebar variant="inset" {...sidebarProps}>
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
        {allItems.map((group, index) => (
          <NavMain
            key={index}
            title={group.title}
            items={group.items as never}
          />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          openSettings={openSettings}
          user={{
            name: `${user?.firstName} ${user?.lastName}`,
            email: user?.email,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
