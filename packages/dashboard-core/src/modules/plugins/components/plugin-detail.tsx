import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Separator } from "../../../components/ui/separator";
import { ArrowLeft } from "lucide-react";
import type { PluginResponseModel } from "@kitejs-cms/core/modules/plugins/models/plugin-response.model";

interface PluginDetailProps {
  plugin: PluginResponseModel;
  onBack: () => void;
}

export function PluginDetail({ plugin, onBack }: PluginDetailProps) {
  const { t } = useTranslation("plugins");
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full shadow-neutral-50 gap-0 py-0">
        <CardHeader className="bg-neutral-50 py-4 rounded-t-xl">
          <CardTitle className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">{t("details.back")}</span>
            </Button>
            {plugin.name}
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0 text-sm">
          <div className="flex justify-between border-b py-3">
            <div className="pl-4 w-1/3 text-left">
              {t("settings.columns.name")}
            </div>
            <div className="w-2/3 text-left">{plugin.name}</div>
          </div>
          <div className="flex justify-between border-b py-3">
            <div className="pl-4 w-1/3 text-left">
              {t("details.namespace")}
            </div>
            <div className="w-2/3 text-left">{plugin.namespace}</div>
          </div>
          <div className="flex justify-between border-b py-3">
            <div className="pl-4 w-1/3 text-left">
              {t("settings.columns.version")}
            </div>
            <div className="w-2/3 text-left">{plugin.version}</div>
          </div>
          <div className="flex justify-between border-b py-3">
            <div className="pl-4 w-1/3 text-left">
              {t("settings.columns.installedAt")}
            </div>
            <div className="w-2/3 text-left">
              {new Date(plugin.installedAt).toLocaleString()}
            </div>
          </div>
          <div className="flex justify-between border-b py-3">
            <div className="pl-4 w-1/3 text-left">
              {t("details.updatedAt")}
            </div>
            <div className="w-2/3 text-left">
              {new Date(plugin.updatedAt).toLocaleString()}
            </div>
          </div>
          {plugin.author && (
            <div className="flex justify-between border-b py-3">
              <div className="pl-4 w-1/3 text-left">
                {t("details.author")}
              </div>
              <div className="w-2/3 text-left">{plugin.author}</div>
            </div>
          )}
          {plugin.description && (
            <div className="flex justify-between border-b py-3">
              <div className="pl-4 w-1/3 text-left">
                {t("details.description")}
              </div>
              <div className="w-2/3 text-left">{plugin.description}</div>
            </div>
          )}
          {plugin.dependencies && plugin.dependencies.length > 0 && (
            <div className="flex justify-between border-b py-3">
              <div className="pl-4 w-1/3 text-left">
                {t("details.dependencies")}
              </div>
              <div className="w-2/3 text-left">
                {plugin.dependencies.join(", ")}
              </div>
            </div>
          )}
          <div className="flex justify-between border-b py-3">
            <div className="pl-4 w-1/3 text-left">
              {t("settings.columns.status")}
            </div>
            <div className="w-2/3 text-left">{plugin.status}</div>
          </div>
          {plugin.lastError && (
            <div className="flex justify-between border-b py-3">
              <div className="pl-4 w-1/3 text-left">
                {t("details.lastError")}
              </div>
              <div className="w-2/3 text-left">{plugin.lastError}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default PluginDetail;
