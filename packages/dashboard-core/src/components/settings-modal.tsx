import { useState } from "react";
import { SettingsModel } from "../models/settings.model";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  XIcon,
  Settings2,
  Palette,
  Bell,
  Shield,
  ChevronDown,
  Dot,
} from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections?: SettingsModel[];
}

const defaultSections: SettingsModel[] = [
  {
    id: "general",
    title: "General",
    icon: <Settings2 className="w-4 h-4 mr-2" />,
    description: "Configure your general preferences and settings.",
    children: [
      { id: "profile", title: "Profile" },
      { id: "preferences", title: "Preferences" },
    ],
  },
  {
    id: "appearance",
    title: "Appearance",
    icon: <Palette className="w-4 h-4 mr-2" />,
    description: "Customize the look and feel of your dashboard.",
    children: [
      { id: "theme", title: "Theme" },
      { id: "layout", title: "Layout" },
    ],
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: <Bell className="w-4 h-4 mr-2" />,
    description: "Manage your notification preferences.",
    children: [
      { id: "email", title: "Email" },
      { id: "push", title: "Push Notifications" },
    ],
  },
  {
    id: "security",
    title: "Security",
    icon: <Shield className="w-4 h-4 mr-2" />,
    description: "Configure your security settings.",
    children: [
      { id: "password", title: "Password" },
      { id: "2fa", title: "Two-Factor Authentication" },
    ],
  },
];

export function SettingsModal({
  open,
  onOpenChange,
  sections = defaultSections,
}: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<string>(
    sections[0]?.id || ""
  );

  return (
    <Dialog open={!open} onOpenChange={onOpenChange}>
      <DialogContent position="full" className="p-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-between w-full p-4">
            <div className="flex items-center gap-2">Settings</div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-gray-100 text-gray-400 border-gray-400 font-medium px-2 py-0.5"
              >
                Esc
              </Badge>
              <DialogClose className="text-gray-500 hover:text-gray-700">
                <XIcon className="w-5 h-5" />
              </DialogClose>
            </div>
          </DialogTitle>
        </DialogHeader>
        <Separator />

        <div className="flex flex-col md:flex-row h-[calc(100vh-72px)]">
          {/* Collapsible sidebar */}
          <div className="w-full md:w-64 md:flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-200 transition-all duration-300 ease-in-out">
            <nav className="space-y-1 p-4">
              {defaultSections.map((section) => (
                <div key={section.id} className="transition-all duration-200">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start group transition-colors duration-200",
                      activeSection === section.id
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                    onClick={() => {
                      setActiveSection(section.id);
                      // On mobile, if section has no children, hide the menu
                      if (!section.children && window.innerWidth < 768) {
                        const contentElement =
                          document.querySelector(".settings-content");
                        if (contentElement) {
                          contentElement.scrollIntoView({ behavior: "smooth" });
                        }
                      }
                    }}
                  >
                    <div className="flex items-center flex-1">
                      {section.icon}
                      <span>{section.title}</span>
                    </div>
                    {section.children && (
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform duration-200",
                          activeSection === section.id
                            ? "transform rotate-180"
                            : ""
                        )}
                      />
                    )}
                  </Button>
                  {section.children && activeSection === section.id && (
                    <div className="space-y-0 animate-in slide-in-from-left-1">
                      {section.children.map((child) => (
                        <Button
                          key={child.id}
                          variant="ghost"
                          className="w-full justify-start pl-3 py-0.5 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                          onClick={() => {
                            setActiveSection(child.id);
                            // On mobile, hide the menu when a child is selected
                            if (window.innerWidth < 768) {
                              const contentElement =
                                document.querySelector(".settings-content");
                              if (contentElement) {
                                contentElement.scrollIntoView({
                                  behavior: "smooth",
                                });
                              }
                            }
                          }}
                        >
                          <Dot className="scale-150" />
                          {child.title}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Content area */}
          <div className="flex-1 p-6 overflow-auto">
            <ScrollArea className="h-full">
              {sections.map(
                (section) =>
                  activeSection === section.id && (
                    <div key={section.id}>
                      <div className="flex items-center gap-2 mb-4">
                        {section.icon}
                        <h2 className="text-lg font-medium">{section.title}</h2>
                      </div>
                      {section.description && (
                        <p className="text-sm text-gray-500 mt-2 mb-6">
                          {section.description}
                        </p>
                      )}
                      {section.component}
                      {section.children?.map(
                        (child) =>
                          activeSection === child.id && (
                            <div key={child.id}>
                              <h3 className="text-md font-medium mb-4">
                                {child.title}
                              </h3>
                              {child.component}
                            </div>
                          )
                      )}
                    </div>
                  )
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
