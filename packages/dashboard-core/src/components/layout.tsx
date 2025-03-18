import { SidebarProvider, SidebarInset, SidebarTrigger } from "./ui/sidebar";
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
import { useBreadcrumb } from "../context/breadcrumb-context";
import { SidebarMenuItem } from "../models/module.model";
import { useState } from "react";
import { SettingsModal } from "./settings-modal";

export function Layout({ menuItems }: { menuItems: SidebarMenuItem[] }) {
  const [settingsModal, setSettingsModal] = useState(false);
  const { breadcrumb } = useBreadcrumb();

  return (
    <SidebarProvider>
      <AppSidebar
        items={menuItems}
        openSettings={() => setSettingsModal(true)}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumb.map((item, index) => (
                  <BreadcrumbItem key={item.path}>
                    {index < breadcrumb.length - 1 ? (
                      <>
                        <BreadcrumbLink href={item.path}>
                          {item.label}
                        </BreadcrumbLink>
                        <BreadcrumbSeparator />
                      </>
                    ) : (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <SettingsModal open={settingsModal} onOpenChange={setSettingsModal} />
          <div className="min-h-[100vh] flex-1 md:min-h-min">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
