import { useState } from "react";
import { SettingsModel } from "../models/settings.model";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { XIcon, ChevronDown, Dot } from "lucide-react";
import { useSettingsContext } from "../context/settings-context";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections?: SettingsModel[];
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { settingsSection, hasUnsavedChanges, setHasUnsavedChanges } =
    useSettingsContext();
  const { t } = useTranslation();
  const [showUnsavedChangesAlert, setShowUnsavedChangesAlert] = useState(false);

  const initialActiveSection = (() => {
    if (!settingsSection.length) return "";
    const firstSection = settingsSection[0];
    if (
      !firstSection.component &&
      firstSection.children &&
      firstSection.children.length > 0
    ) {
      return firstSection.children[0].key;
    }
    return firstSection.key;
  })();

  const [activeSection, setActiveSection] =
    useState<string>(initialActiveSection);
  const [expandedSection, setExpandedSection] = useState<string>(
    settingsSection[0]?.key || ""
  );

  const handleOpenChange = (open: boolean) => {
    if (!open && hasUnsavedChanges) {
      setShowUnsavedChangesAlert(true);
      return;
    }
    onOpenChange(open);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
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
                {settingsSection.map((section) => (
                  <div
                    key={section.key}
                    className="transition-all duration-200"
                  >
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start group transition-colors duration-200",
                        expandedSection === section.key
                          ? ""
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                      onClick={() => {
                        if (section.children) {
                          const newExpandedSection =
                            expandedSection === section.key ? "" : section.key;
                          setExpandedSection(newExpandedSection);
                          if (
                            newExpandedSection &&
                            section.children.length > 0 &&
                            !section.component
                          ) {
                            setActiveSection(section.children[0].key);
                          } else if (!section.component) {
                            setExpandedSection(section.key);
                            setActiveSection(section.children[0].key);
                          }
                        } else {
                          setActiveSection(section.key);
                          if (window.innerWidth < 768) {
                            const contentElement =
                              document.querySelector(".settings-content");
                            if (contentElement) {
                              contentElement.scrollIntoView({
                                behavior: "smooth",
                              });
                            }
                          }
                        }
                      }}
                    >
                      <div className="flex items-center flex-1 gap-2">
                        <div className="w-4 h-4 mr-2">{section.icon}</div>
                        <span>{t(section.title)}</span>
                      </div>
                      {section.children && (
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-transform duration-200",
                            activeSection === section.key
                              ? "transform rotate-180"
                              : ""
                          )}
                        />
                      )}
                    </Button>
                    {section.children && expandedSection === section.key && (
                      <div className="space-y-0 animate-in slide-in-from-left-1">
                        {section.children.map((child) => (
                          <Button
                            key={child.key}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start pl-4 py-0.5 text-xs",
                              activeSection === child.key
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                              "transition-colors duration-200"
                            )}
                            onClick={() => {
                              setActiveSection(child.key);
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
                            <Dot className="scale-165" />
                            {t(child.title)}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>

            {/* Content area */}
            <div className="flex-1 p-6 overflow-auto settings-content">
              <ScrollArea className="h-full">
                {settingsSection.map((section) => {
                  const isParentActive = activeSection === section.key;
                  const activeChild = section.children?.find(
                    (child) => activeSection === child.key
                  );

                  if (isParentActive || activeChild) {
                    return (
                      <div key={section.key}>
                        {isParentActive && (
                          <>
                            <div className="flex items-center gap-2 mb-4">
                              <div className="scale-75">{section.icon}</div>
                              <h2 className="text-lg font-medium">
                                {t(section.title)}
                              </h2>
                            </div>
                            {section.description && (
                              <p className="text-sm text-gray-500 mt-2 mb-6">
                                {t(section.description)}
                              </p>
                            )}
                            {section.component}
                          </>
                        )}
                        {activeChild && (
                          <div key={activeChild.key}>
                            <div className="flex items-center gap-2 mb-4">
                              <div className="scale-75">{section.icon}</div>
                              <h2 className="text-lg font-medium">
                                {t(activeChild.title)}
                              </h2>
                            </div>
                            {activeChild.description && (
                              <p className="text-sm text-gray-500 mt-2 mb-6">
                                {t(activeChild.description)}
                              </p>
                            )}
                            {activeChild.component}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showUnsavedChangesAlert}
        onOpenChange={setShowUnsavedChangesAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("settings.unsaved_changes.title", "Unsaved Changes")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "settings.unsaved_changes.description",
                "You have unsaved changes. Are you sure you want to close the settings?"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setShowUnsavedChangesAlert(false)}
            >
              {t("settings.unsaved_changes.cancel", "Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowUnsavedChangesAlert(false);
                setHasUnsavedChanges(false);
                onOpenChange(false);
              }}
            >
              {t("settings.unsaved_changes.confirm", "Close without saving")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
