import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import { Skeleton } from "../../../components/ui/skeleton";
import { useSettingsContext } from "../../../context/settings-context";
import type { PluginResponseModel } from "@kitejs-cms/core/modules/plugins/models/plugin-response.model";
import { MoreVertical, Check, Ban, Eye } from "lucide-react";
import { PluginDetail } from "./plugin-detail";

export function PluginsSettings() {
  const { t } = useTranslation("plugins");
  const {
    plugins,
    pluginsLoading: loading,
    fetchPlugins,
    disablePlugin,
    enablePlugin,
  } = useSettingsContext();
  const [selectedPlugin, setSelectedPlugin] = useState<PluginResponseModel | null>(
    null,
  );

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  const handleDisable = async (namespace: string) => {
    const success = await disablePlugin(namespace);
    if (success) {
      toast.warning(t("settings.toast.disabled"));
    } else {
      toast.error(t("settings.toast.error"));
    }
  };

  const handleEnable = async (namespace: string) => {
    const success = await enablePlugin(namespace);
    if (success) {
      toast.success(t("settings.toast.enabled", "Plugin enabled."));
    } else {
      toast.error(t("settings.toast.error"));
    }
  };

  const getStatusLabel = (
    status: PluginResponseModel["status"],
    enabled?: boolean,
  ) => {
    if (!enabled) {
      return t("settings.status.disabled", "Disabled");
    }
    switch (status) {
      case "installed":
        return t("settings.status.installed", "Installed");
      case "pending":
        return t("settings.status.pending", "Pending");
      case "failed":
        return t("settings.status.failed", "Failed");
      default:
        return status;
    }
  };

  if (loading) {
    // Skeleton table while loading
    return (
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("settings.columns.name")}</TableHead>
              <TableHead>{t("settings.columns.version")}</TableHead>
              <TableHead>{t("settings.columns.installedAt")}</TableHead>
              <TableHead>{t("settings.columns.enabled")}</TableHead>
              <TableHead>{t("settings.columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-24 rounded-xl" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (selectedPlugin) {
    return (
      <PluginDetail
        plugin={selectedPlugin}
        onBack={() => setSelectedPlugin(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("settings.columns.name")}</TableHead>
            <TableHead>{t("settings.columns.version")}</TableHead>
            <TableHead>{t("settings.columns.installedAt")}</TableHead>
            <TableHead>{t("settings.columns.enabled")}</TableHead>
            <TableHead>{t("settings.columns.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plugins?.map((plugin) => (
            <TableRow key={plugin.name}>
              <TableCell>
                <div className="flex items-center gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        aria-label={getStatusLabel(
                          plugin.status,
                          plugin.enabled,
                        )}
                        title={getStatusLabel(plugin.status, plugin.enabled)}
                        className={`inline-block h-3 w-3 rounded-full ${
                          !plugin.enabled
                            ? "bg-orange-500"
                            : plugin.status === "installed"
                              ? "bg-green-500"
                              : plugin.status === "pending"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                        }`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {getStatusLabel(plugin.status, plugin.enabled)}
                        </p>
                        {plugin.status === "failed" && plugin.lastError && (
                          <p className="text-xs opacity-80">
                            {plugin.lastError}
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                  <Button
                    variant="link"
                    className="p-0 h-auto truncate max-w-[28ch] no-underline hover:no-underline"
                    title={plugin.name}
                    onClick={() => setSelectedPlugin(plugin)}
                  >
                    {plugin.name}
                  </Button>
                </div>
              </TableCell>
              <TableCell>{plugin.version}</TableCell>
              <TableCell>
                {new Date(plugin.installedAt).toLocaleDateString()}
              </TableCell>

              <TableCell>
                {plugin.enabled
                  ? t("settings.enabled.enabled")
                  : plugin.pendingDisable
                    ? t("settings.enabled.pending")
                    : t("settings.enabled.disabled")}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="shadow-none"
                      size="icon"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSelectedPlugin(plugin)}>
                      <Eye className="mr-2 h-4 w-4" />
                      {t("settings.buttons.view")}
                    </DropdownMenuItem>
                    {plugin.namespace !== "core" && (
                      plugin.enabled ? (
                        <DropdownMenuItem
                          onClick={() => handleDisable(plugin.namespace)}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          {t("settings.buttons.disable")}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleEnable(plugin.namespace)}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          {t("settings.buttons.enable")}
                        </DropdownMenuItem>
                      )
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default PluginsSettings;
