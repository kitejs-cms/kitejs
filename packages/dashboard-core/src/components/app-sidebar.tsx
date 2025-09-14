import * as React from "react";
import { SidebarMenuItemModel as ItemModule } from "../models/module.model";
import { useAuthContext } from "../context/auth-context";
import {
  Command,
  LayoutDashboard,
  GripVertical,
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
import { DashboardLayoutSettingsModel } from "../models/dashboard-layout-settings.model";

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

  const filteredItems = React.useMemo(
    () => filterItems(items),
    [filterItems, items]
  );

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
  const [layoutLoaded, setLayoutLoaded] = React.useState(false);
  const [originalLayout, setOriginalLayout] = React.useState<string[]>([]);
  const [editing, setEditing] = React.useState(false);
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  const startEditing = React.useCallback(() => {
    setOriginalLayout(layout);
    setEditing(true);
  }, [layout]);

  React.useEffect(() => {
    (async () => {
      try {
        const stored = await getSetting<{
          value: DashboardLayoutSettingsModel;
        }>("dashboard", "dashboard:layout");
        if (stored?.value?.menu?.length) {
          setLayout(stored.value.menu);
        } else {
          setLayout(defaultItems.map((i) => i.key!));
        }
      } catch {
        setLayout(defaultItems.map((i) => i.key!));
      } finally {
        setLayoutLoaded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!layoutLoaded) return;
    const keys = defaultItems.map((i) => i.key!);
    setLayout((prev) => {
      const existing = prev.filter((k) => keys.includes(k));
      const missing = keys.filter((k) => !existing.includes(k));
      const next = [...existing, ...missing];
      return next.length === prev.length && next.every((k, i) => k === prev[i])
        ? prev
        : next;
    });
  }, [defaultItems, layoutLoaded]);

  const displayed = React.useMemo(
    () => layout.filter((key) => itemMap.has(key)),
    [layout, itemMap]
  );

  const available = React.useMemo(
    () => defaultItems.filter((item) => !layout.includes(item.key!)),
    [defaultItems, layout]
  );

  const handleDragStart = (index: number) => setDraggedIndex(index);

  const handleDrop = () => {
    if (draggedIndex === null || dragOverIndex === null) return;
    const newLayout = [...layout];
    const [moved] = newLayout.splice(draggedIndex, 1);
    let index = dragOverIndex;
    if (draggedIndex < dragOverIndex) {
      index -= 1;
    }
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
    const existing = await getSetting<{ value: DashboardLayoutSettingsModel }>(
      "dashboard",
      "dashboard:layout"
    );
    await updateSetting("dashboard", "dashboard:layout", {
      ...(existing?.value ?? {}),
      menu: layout,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setLayout(originalLayout);
    setEditing(false);
  };

  if (!layoutLoaded) {
    return null;
  }

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
          <div className="p-2">
            <div className="mb-2 flex justify-end gap-2">
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
            <div className="flex flex-col gap-2">
              {layout.map((key, index) => {
                const item = itemMap.get(key);
                if (!item) return null;
                return (
                  <React.Fragment key={key}>
                    {draggedIndex !== null && (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverIndex(index);
                        }}
                        onDrop={handleDrop}
                        className={`h-2 rounded-md border-2 border-dashed ${
                          dragOverIndex === index
                            ? "border-sidebar-accent"
                            : "border-border"
                        }`}
                      />
                    )}
                    <div
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragEnd={() => {
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                      }}
                      className="flex items-center gap-2 rounded-md border border-border bg-background p-2"
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
                  </React.Fragment>
                );
              })}
              {draggedIndex !== null && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIndex(layout.length);
                  }}
                  onDrop={handleDrop}
                  className={`h-2 rounded-md border-2 border-dashed ${
                    dragOverIndex === layout.length
                      ? "border-sidebar-accent"
                      : "border-border"
                  }`}
                />
              )}
            </div>
            {available.length > 0 && (
              <div className="pt-2">
                {available.map((item) => (
                  <Button
                    key={item.key}
                    variant="outline"
                    className="mb-2 w-full justify-start"
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
            <NavMain
              key={index}
              title={group.title}
              items={group.items as never}
              onSettings={startEditing}
            />
          ))
        )}
      </SidebarContent>
      <SidebarFooter className="flex flex-col gap-2">
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
