import * as React from "react";
import { SidebarMenuItemModel as ItemModule } from "../models/module.model";
import { useAuthContext } from "../context/auth-context";
import {
  Command,
  LayoutDashboard,
  GripVertical,
  Settings,
  X,
  Check,
  Plus,
} from "lucide-react";
import { NavMain } from "../components/nav-main";
import { NavUser } from "../components/nav-user";
import { useHasPermission } from "../hooks/use-has-permission";
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
import { Button } from "../components/ui/button";
import { useTranslation } from "react-i18next";
import { DashboardMenuSettingsModel } from "../models/dashboard-menu-settings.model";

export function AppSidebar({
  items = [],
  openSettings,
  ...sidebarProps
}: React.ComponentProps<typeof Sidebar> & {
  items?: ItemModule[];
  openSettings?: () => void;
}) {
  const { cmsSettings, getSetting, updateSetting } = useSettingsContext();
  const { user } = useAuthContext();
  const hasPermission = useHasPermission();
  const { t } = useTranslation();

  const filterItems = React.useCallback(
    (list: ItemModule[]): ItemModule[] =>
      list
        .filter(
          (item) =>
            !item.requiredPermissions ||
            hasPermission(item.requiredPermissions)
        )
        .map((item) => ({
          ...item,
          items: item.items
            ? filterItems(item.items as ItemModule[])
            : undefined,
        })),
    [hasPermission]
  );

  const filteredItems = filterItems(items);

  const defaultItems = React.useMemo(
    () => [
      { key: "dashboard", title: "Dashboard", url: "/", icon: LayoutDashboard },
      ...filteredItems,
    ],
    [filteredItems]
  );

  const itemMap = React.useMemo(
    () => new Map(defaultItems.map((item) => [item.key!, item])),
    [defaultItems]
  );

  const [layout, setLayout] = React.useState<string[]>([]);
  const [originalLayout, setOriginalLayout] = React.useState<string[]>([]);
  const [editing, setEditing] = React.useState(false);
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    (async () => {
      const stored =
        await getSetting<{ value: DashboardMenuSettingsModel }>(
          "dashboard",
          "dashboard:menu"
        );
      if (stored?.value?.order?.length) {
        setLayout(stored.value.order);
      } else {
        setLayout(defaultItems.map((i) => i.key!));
      }
    })();
  }, [getSetting, defaultItems]);

  React.useEffect(() => {
    setLayout((prev) => {
      const keys = defaultItems.map((i) => i.key!);
      const existing = prev.filter((k) => keys.includes(k));
      const missing = keys.filter((k) => !existing.includes(k));
      return [...existing, ...missing];
    });
  }, [defaultItems]);

  const displayed = React.useMemo(
    () => layout.filter((key) => itemMap.has(key)),
    [layout, itemMap]
  );

  const available = React.useMemo(
    () => defaultItems.filter((item) => !layout.includes(item.key!)),
    [defaultItems, layout]
  );

  const handleDragStart = (index: number) => setDraggedIndex(index);

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const newLayout = [...layout];
    const [moved] = newLayout.splice(draggedIndex, 1);
    newLayout.splice(index, 0, moved);
    setLayout(newLayout);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleRemove = (key: string) => {
    setLayout(layout.filter((k) => k !== key));
  };

  const handleAdd = (key: string) => {
    setLayout([...layout, key]);
  };

  const handleSave = async () => {
    await updateSetting("dashboard", "dashboard:menu", { order: layout });
    setEditing(false);
  };

  const handleCancel = () => {
    setLayout(originalLayout);
    setEditing(false);
  };

  const orderedItems = React.useMemo(
    () => displayed.map((key) => itemMap.get(key)!).filter(Boolean),
    [displayed, itemMap]
  );

  const menuGroups = [
    {
      title: "Main Menu",
      items: orderedItems,
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
        {editing ? (
          <div className="p-2 space-y-2">
            {displayed.map((key, index) => {
              const item = itemMap.get(key)!;
              return (
                <div
                  key={key}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIndex(index);
                  }}
                  onDrop={() => handleDrop(index)}
                  className={`flex items-center gap-2 rounded-md border p-2 ${
                    dragOverIndex === index
                      ? "border-sidebar-accent"
                      : "border-transparent"
                  }`}
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <span className="flex-1">{t(item.title)}</span>
                  {key !== "dashboard" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(key)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
            {available.length > 0 && (
              <div className="pt-2">
                {available.map((item) => (
                  <Button
                    key={item.key}
                    variant="outline"
                    className="w-full justify-start mb-2"
                    onClick={() => handleAdd(item.key!)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t(item.title)}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          menuGroups.map((group, index) => (
            <NavMain key={index} title={group.title} items={group.items as never} />
          ))
        )}
      </SidebarContent>
      <SidebarFooter className="flex flex-col gap-2">
        {editing ? (
          <div className="flex gap-2 px-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSave}
              aria-label="Save"
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setOriginalLayout(layout);
              setEditing(true);
            }}
            aria-label="Customize Menu"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
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
