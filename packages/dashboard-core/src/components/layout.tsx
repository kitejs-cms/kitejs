import { SidebarProvider, SidebarInset, SidebarTrigger } from "./ui/sidebar";
import { Users, UserPlus, Shield, LayoutDashboard } from "lucide-react";
import { Separator } from "@radix-ui/react-separator";
import { AppSidebar } from "./app-sidebar";
import { Outlet } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "./ui/breadcrumb";

const sidebarData = [
  {
    title: "Main Menu",
    items: [
      {
        name: "Dashboard",
        url: "#dashboard",
        icon: LayoutDashboard,
      },
      {
        name: "Users",
        url: "#users",
        icon: Users,
        subItems: [
          {
            name: "Manage Users",
            url: "#users/manage",
            icon: UserPlus,
          },
          {
            name: "Manage Roles",
            url: "#users/roles",
            icon: Shield,
          },
        ],
      },
    ],
  },
];

export function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
          </div>
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
