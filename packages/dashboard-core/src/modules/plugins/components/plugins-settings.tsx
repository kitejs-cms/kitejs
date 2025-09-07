import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
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
import { useApi } from "../../../hooks/use-api";
import type { PluginResponseModel } from "@kitejs-cms/core/modules/plugins/models/plugin-response.model";

export function PluginsSettings() {
  const { t } = useTranslation("plugins");
  const {
    data: plugins,
    loading,
    fetchData: fetchPlugins,
  } = useApi<PluginResponseModel[]>();
  const { fetchData: disablePlugin } = useApi<{
    success: boolean;
    restartRequired: boolean;
  }>();

  useEffect(() => {
    fetchPlugins("plugins");
  }, [fetchPlugins]);

  const handleDisable = async (namespace: string) => {
    const { error } = await disablePlugin(
      `plugins/${namespace}/disable`,
      "POST"
    );
    if (!error) {
      toast.warning(t("settings.toast.disabled"));
      fetchPlugins("plugins");
    } else {
      toast.error(t("settings.toast.error"));
    }
  };

  const getStatusLabel = (
    status: PluginResponseModel["status"],
    enabled?: boolean
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
                          plugin.enabled
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
                  <span className="truncate max-w-[28ch]" title={plugin.name}>
                    {plugin.name}
                  </span>
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
                {plugin.enabled && (
                  <Button
                    size="sm"
                    onClick={() => handleDisable(plugin.namespace)}
                  >
                    {t("settings.buttons.disable")}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default PluginsSettings;
