import * as React from "react";
import { SidebarMenuItemModel as ItemModule } from "../models/module.model";
import { useAuthContext } from "../context/auth-context";
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
import { useSettingsContext } from "../context/settings-context";

export function AppSidebar({
  items = [],
  openSettings,
  ...sidebarProps
}: React.ComponentProps<typeof Sidebar> & {
  items?: ItemModule[];
  openSettings?: () => void;
}) {
  const { cmsSettings } = useSettingsContext();
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
                  <span className="truncate font-semibold">
                    {cmsSettings?.siteName}
                  </span>
                  <span className="truncate text-xs">
                    {cmsSettings?.siteUrl}
                  </span>
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
        {user && (
          <NavUser
            openSettings={openSettings}
            user={{
              name: `${user?.firstName} ${user?.lastName}`,
              email: user?.email,
            }}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
