import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  useApi,
  useBreadcrumb,
  useHasPermission,
} from "@kitejs-cms/dashboard-core";
import type { AnalyticsSummaryResponseModel } from "@kitejs-cms/plugin-analytics-api";

export function AnalyticsOverviewPage() {
  const { t } = useTranslation("analytics");
  const { setBreadcrumb } = useBreadcrumb();
  const { hasPermission } = useHasPermission();
  const { data: summary, fetchData: fetchSummary } =
    useApi<AnalyticsSummaryResponseModel>();

  useEffect(() => {
    setBreadcrumb([
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.analytics"), path: "/analytics" },
    ]);
    if (hasPermission("analytics:summary.read")) {
      fetchSummary("/analytics/events/summary");
    }
  }, [setBreadcrumb, t, fetchSummary, hasPermission]);

  return (
    <div className="space-y-4 p-4">
      {hasPermission("analytics:summary.read") && (
        <Card>
          <CardHeader>
            <CardTitle>{t("summary.title")}</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div>
              {t("summary.totalEvents")}: {summary?.totalEvents ?? "-"}
            </div>
            <div>
              {t("summary.uniqueVisitors")}: {summary?.uniqueVisitors ?? "-"}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
