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
import type { AnalyticsTechnologiesResponseModel } from "@kitejs-cms/plugin-analytics-api";

export function AnalyticsTechnologiesPage() {
  const { t } = useTranslation("analytics");
  const { setBreadcrumb } = useBreadcrumb();
  const { data, fetchData, loading } = useApi<
    AnalyticsTechnologiesResponseModel
  >();

  useEffect(() => {
    setBreadcrumb([
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.analytics"), path: "/analytics" },
      { label: t("breadcrumb.technologies"), path: "/analytics/technologies" },
    ]);
    fetchData("analytics/events/technologies");
  }, [setBreadcrumb, t, fetchData]);

  const browserData = useMemo(
    () =>
      Object.entries(data?.browsers ?? {}).map(([key, count]) => ({
        key,
        count,
      })),
    [data],
  );
  const osData = useMemo(
    () =>
      Object.entries(data?.os ?? {}).map(([key, count]) => ({ key, count })),
    [data],
  );
  const deviceData = useMemo(
    () =>
      Object.entries(data?.devices ?? {}).map(([key, count]) => ({
        key,
        count,
      })),
    [data],
  );

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
