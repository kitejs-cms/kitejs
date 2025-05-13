import { SidebarProvider, SidebarInset, SidebarTrigger } from "./ui/sidebar";
import { Separator } from "@radix-ui/react-separator";
import { AppSidebar } from "./app-sidebar";
import { Outlet } from "react-router-dom";
import { useBreadcrumb } from "../context/breadcrumb-context";
import { SidebarMenuItemModel } from "../models/module.model";
import { useState } from "react";
import { SettingsModal } from "./settings-modal";
import { StorageExplorer } from "../modules/core/components/storage-explorer/storage-explorer";
import { Toaster } from "./ui/toaster";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "./ui/breadcrumb";

export function Layout({ menuItems }: { menuItems: SidebarMenuItemModel[] }) {
  const [settingsModal, setSettingsModal] = useState(false);
  const { breadcrumb } = useBreadcrumb();

  return (
    <SidebarProvider>
      <AppSidebar
        items={menuItems}
        openSettings={() => setSettingsModal(true)}
      />
      <StorageExplorer />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumb.map((item, index) => (
                  <BreadcrumbItem
                    key={item.path}
                    className="max-w-[140px] truncate"
                  >
                    {index < breadcrumb.length - 1 ? (
                      <>
                        <BreadcrumbLink href={item.path} className="truncate">
                          {item.label}
                        </BreadcrumbLink>
                        <BreadcrumbSeparator />
                      </>
                    ) : (
                      <BreadcrumbPage className="truncate">
                        {item.label}
                      </BreadcrumbPage>
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
            <Toaster />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
