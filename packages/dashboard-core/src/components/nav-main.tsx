import { ChevronRight, LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "./ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { useTranslation } from "react-i18next";

export function NavMain({
  items,
  title,
}: {
  title?: string;
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
      icon?: LucideIcon;
    }[];
  }[];
}) {
  const { t } = useTranslation();

  return (
    <SidebarGroup>
      {title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={
              item.isActive ||
              item.items?.some(
                (subItem) => window.location.pathname === subItem.url
              )
            }
          >
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={window.location.pathname === item.url}
              >
                {item.items?.length ? (
                  <CollapsibleTrigger asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{t(item.title)}</span>
                    </a>
                  </CollapsibleTrigger>
                ) : (
                  <a href={item.url}>
                    <item.icon />
                    <span>{t(item.title)}</span>
                  </a>
                )}
              </SidebarMenuButton>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90 data-[state=open]:text-sidebar-accent-foreground">
                      <ChevronRight />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem, key) => (
                        <SidebarMenuSubItem key={key}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={window.location.pathname === subItem.url}
                          >
                            <a href={subItem.url}>
                              <span>{t(subItem.title)}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
