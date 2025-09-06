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

  if (loading) {
    return <div>{t("settings.loading")}</div>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("settings.columns.namespace")}</TableHead>
            <TableHead>{t("settings.columns.version")}</TableHead>
            <TableHead>{t("settings.columns.status")}</TableHead>
            <TableHead>{t("settings.columns.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plugins?.map((plugin) => (
            <TableRow key={plugin.namespace}>
              <TableCell>{plugin.namespace}</TableCell>
              <TableCell>{plugin.version}</TableCell>
              <TableCell>
                {plugin.enabled
                  ? t("settings.status.enabled")
                  : plugin.pendingDisable
                  ? t("settings.status.pending")
                  : t("settings.status.disabled")}
              </TableCell>
              <TableCell>
                {plugin.enabled && (
                  <Button
                    variant="destructive"
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

