import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useApi } from "../../../hooks/use-api";
import type { PluginResponseModel } from "@kitejs-cms/core/modules/plugins/models/plugin-response.model";

export function PluginDetailPage() {
  const { namespace } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("plugins");
  const { data: plugin, fetchData } = useApi<PluginResponseModel>();

  useEffect(() => {
    if (namespace) {
      fetchData(`plugins/${namespace}`);
    }
  }, [namespace, fetchData]);

  if (!plugin) {
    return <div>{t("settings.loading")}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{plugin.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <strong>{t("settings.columns.name")}:</strong> {plugin.name}
        </div>
        <div>
          <strong>Namespace:</strong> {plugin.namespace}
        </div>
        <div>
          <strong>{t("settings.columns.version")}:</strong> {plugin.version}
        </div>
        <div>
          <strong>{t("settings.columns.installedAt")}:</strong>{" "}
          {new Date(plugin.installedAt).toLocaleString()}
        </div>
        <div>
          <strong>Updated:</strong> {new Date(plugin.updatedAt).toLocaleString()}
        </div>
        {plugin.author && (
          <div>
            <strong>Author:</strong> {plugin.author}
          </div>
        )}
        {plugin.description && (
          <div>
            <strong>Description:</strong> {plugin.description}
          </div>
        )}
        {plugin.dependencies && plugin.dependencies.length > 0 && (
          <div>
            <strong>Dependencies:</strong> {plugin.dependencies.join(", ")}
          </div>
        )}
        <div>
          <strong>Status:</strong> {plugin.status}
        </div>
        {plugin.lastError && (
          <div>
            <strong>Last error:</strong> {plugin.lastError}
          </div>
        )}
        <Button className="mt-4" onClick={() => navigate(-1)}>
          {t("details.back")}
        </Button>
      </CardContent>
    </Card>
  );
}

export default PluginDetailPage;
