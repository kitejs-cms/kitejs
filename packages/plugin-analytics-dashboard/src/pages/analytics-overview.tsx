import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  DataTable,
  useApi,
  useBreadcrumb,
  useHasPermission,
} from "@kitejs-cms/dashboard-core";
import type {
  AnalyticsEventResponseModel,
  AnalyticsSummaryResponseModel,
} from "@kitejs-cms/plugin-analytics-api";

export function AnalyticsOverviewPage() {
  const { t } = useTranslation("analytics");
  const { setBreadcrumb } = useBreadcrumb();
  const { hasPermission } = useHasPermission();
  const { data: events, loading: eventsLoading, fetchData: fetchEvents } =
    useApi<{ data: AnalyticsEventResponseModel[] }>();
  const { data: summary, fetchData: fetchSummary } =
    useApi<AnalyticsSummaryResponseModel>();

  useEffect(() => {
    setBreadcrumb([
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.analytics"), path: "/analytics" },
    ]);
    fetchEvents("/analytics/events");
    if (hasPermission("analytics:summary.read")) {
      fetchSummary("/analytics/events/summary");
    }
  }, [setBreadcrumb, t, fetchEvents, fetchSummary, hasPermission]);

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
      <Card>
        <CardHeader>
          <CardTitle>{t("events.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<AnalyticsEventResponseModel>
            data={events?.data}
            isLoading={eventsLoading}
            columns={[
              { key: "type" as never, label: t("events.type") },
              {
                key: "createdAt" as never,
                label: t("events.createdAt"),
                render: (v) =>
                  v
                    ? new Intl.DateTimeFormat("it-IT", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      } as any).format(new Date(v as string))
                    : "",
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
