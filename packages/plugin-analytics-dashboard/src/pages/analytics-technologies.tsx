import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Label,
  DataTable,
  useApi,
  useBreadcrumb,
} from "@kitejs-cms/dashboard-core";
import { CalendarDays, Globe, Monitor, Smartphone } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from "recharts";
import type { AnalyticsTechnologiesResponseModel } from "@kitejs-cms/plugin-analytics-api";
import { JsonModal } from "@kitejs-cms/dashboard-core/components/json-modal";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function AnalyticsTechnologiesPage() {
  const { t } = useTranslation("analytics");
  const { setBreadcrumb } = useBreadcrumb();
  const { data, fetchData, loading } =
    useApi<AnalyticsTechnologiesResponseModel>();

  const [startDate, setStartDate] = useState(() =>
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)
  );
  const [endDate, setEndDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [jsonOpen, setJsonOpen] = useState(false);

  const loadTechnologies = useCallback(() => {
    const params = new URLSearchParams({ startDate, endDate });
    fetchData(`analytics/events/technologies?${params.toString()}`);
  }, [fetchData, startDate, endDate]);

  useEffect(() => {
    setBreadcrumb([
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.analytics"), path: "/analytics" },
      { label: t("breadcrumb.technologies"), path: "/analytics/technologies" },
    ]);
    loadTechnologies();
  }, [setBreadcrumb, t, loadTechnologies]);

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
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setJsonOpen(true)}>
          {t("technologies.viewJson")}
        </Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-gray-400 to-gray-600 text-white">
              <CalendarDays className="h-5 w-5" />
            </div>
            <CardTitle className="text-sm font-semibold">
              {t("technologies.dateRange")}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex flex-col flex-1">
              <Label htmlFor="startDate" className="text-xs">
                {t("technologies.startDate")}
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex flex-col flex-1">
              <Label htmlFor="endDate" className="text-xs">
                {t("technologies.endDate")}
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={loadTechnologies} className="sm:ml-2">
              {t("technologies.apply")}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-gray-400 to-gray-600 text-white">
              <Globe className="h-5 w-5" />
            </div>
            <CardTitle className="text-sm font-semibold">
              {t("technologies.browser")}
            </CardTitle>
          </div>
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
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-gray-400 to-gray-600 text-white">
              <Monitor className="h-5 w-5" />
            </div>
            <CardTitle className="text-sm font-semibold">
              {t("technologies.os")}
            </CardTitle>
          </div>
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
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-gray-400 to-gray-600 text-white">
              <Smartphone className="h-5 w-5" />
            </div>
            <CardTitle className="text-sm font-semibold">
              {t("technologies.device")}
            </CardTitle>
          </div>
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
      <JsonModal
        data={data ?? {}}
        isOpen={jsonOpen}
        onClose={() => setJsonOpen(false)}
      />
    </div>
  );
}
