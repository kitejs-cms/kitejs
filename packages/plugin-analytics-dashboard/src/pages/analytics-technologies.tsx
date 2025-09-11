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
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from "recharts";
import type { AnalyticsTechnologiesResponseModel } from "@kitejs-cms/plugin-analytics-api";

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export function AnalyticsTechnologiesPage() {
  const { t } = useTranslation("analytics");
  const { setBreadcrumb } = useBreadcrumb();
  const { data, fetchData, loading } =
    useApi<AnalyticsTechnologiesResponseModel>();

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={browserData} dataKey="count" nameKey="key" label>
                    {browserData.map((_, index) => (
                      <Cell
                        key={`browser-cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <DataTable<{ key: string; count: number }>
              data={browserData}
              isLoading={loading}
              columns={[
                { key: "key" as never, label: t("technologies.browser") },
                { key: "count" as never, label: t("technologies.count") },
              ]}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("technologies.os")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={osData} dataKey="count" nameKey="key" label>
                    {osData.map((_, index) => (
                      <Cell
                        key={`os-cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <DataTable<{ key: string; count: number }>
              data={osData}
              isLoading={loading}
              columns={[
                { key: "key" as never, label: t("technologies.os") },
                { key: "count" as never, label: t("technologies.count") },
              ]}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("technologies.device")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deviceData} dataKey="count" nameKey="key" label>
                    {deviceData.map((_, index) => (
                      <Cell
                        key={`device-cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <DataTable<{ key: string; count: number }>
              data={deviceData}
              isLoading={loading}
              columns={[
                { key: "key" as never, label: t("technologies.device") },
                { key: "count" as never, label: t("technologies.count") },
              ]}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
