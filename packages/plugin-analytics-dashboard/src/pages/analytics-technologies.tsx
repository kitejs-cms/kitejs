import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  DataTable,
  useApi,
  useBreadcrumb,
} from "@kitejs-cms/dashboard-core";
import type { AnalyticsEventResponseModel } from "@kitejs-cms/plugin-analytics-api";

function aggregate(
  events: AnalyticsEventResponseModel[] | undefined,
  field: keyof AnalyticsEventResponseModel
) {
  const counts: Record<string, number> = {};
  events?.forEach((e) => {
    const key = (e[field] as string) || "unknown";
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts).map(([key, count]) => ({ key, count }));
}

export function AnalyticsTechnologiesPage() {
  const { t } = useTranslation("analytics");
  const { setBreadcrumb } = useBreadcrumb();
  const { data, fetchData, loading } = useApi<{
    data: AnalyticsEventResponseModel[];
  }>();

  useEffect(() => {
    setBreadcrumb([
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.analytics"), path: "/analytics" },
      { label: t("breadcrumb.technologies"), path: "/analytics/technologies" },
    ]);
    fetchData("analytics/events");
  }, [setBreadcrumb, t, fetchData]);

  const browserData = useMemo(() => aggregate(data?.data, "browser"), [data]);
  const osData = useMemo(() => aggregate(data?.data, "os"), [data]);
  const deviceData = useMemo(() => aggregate(data?.data, "device"), [data]);

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("technologies.browser")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<{ key: string; count: number }>
            data={browserData}
            isLoading={loading}
            columns={[
              { key: "key" as never, label: t("technologies.browser") },
              { key: "count" as never, label: t("technologies.count") },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("technologies.os")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<{ key: string; count: number }>
            data={osData}
            isLoading={loading}
            columns={[
              { key: "key" as never, label: t("technologies.os") },
              { key: "count" as never, label: t("technologies.count") },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("technologies.device")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<{ key: string; count: number }>
            data={deviceData}
            isLoading={loading}
            columns={[
              { key: "key" as never, label: t("technologies.device") },
              { key: "count" as never, label: t("technologies.count") },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
