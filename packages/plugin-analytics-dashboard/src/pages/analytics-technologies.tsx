import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Separator,
  Button,
  Input,
  Label,
  DataTable,
  useApi,
  useBreadcrumb,
} from "@kitejs-cms/dashboard-core";
import { FileJson, Globe, Monitor, Smartphone, Download, Copy } from "lucide-react";
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
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function AnalyticsTechnologiesPage() {
  const { t } = useTranslation("analytics");
  const { setBreadcrumb } = useBreadcrumb();
  const { data, fetchData, loading } =
    useApi<AnalyticsTechnologiesResponseModel>();

  const [startDate, setStartDate] = useState(() =>
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonData, setJsonData] = useState<object>({});

  const loadTechnologies = useCallback(() => {
    const params = new URLSearchParams({ startDate, endDate });
    fetchData(`analytics/events/technologies?${params.toString()}`);
  }, [fetchData, startDate, endDate]);

  const datasetToCsv = (dataset: Record<string, string | number>[]) => {
    if (dataset.length === 0) return "";
    const keys = Object.keys(dataset[0] ?? {});
    const rows = dataset.map((row) =>
      keys.map((key) => String(row[key] ?? "")).join(","),
    );
    return [keys.join(","), ...rows].join("\n");
  };

  const openJson = (dataset: object) => {
    setJsonData(dataset);
    setJsonOpen(true);
  };

  const copyDataset = (dataset: Record<string, string | number>[]) => {
    const csv = datasetToCsv(dataset);
    navigator.clipboard.writeText(csv);
  };

  const downloadDataset = (
    dataset: Record<string, string | number>[],
    filename: string,
  ) => {
    const csv = datasetToCsv(dataset);
    const blob = new Blob([csv], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

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
      <Card className="shadow-neutral-50 gap-0 py-0">
        <CardHeader className="bg-secondary text-primary py-4 rounded-t-xl flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t("technologies.browser")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openJson(browserData)}
              aria-label={t("technologies.viewJson")}
              className="flex items-center"
            >
              <FileJson className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadDataset(browserData, "browsers.csv")}
              aria-label={t("technologies.downloadCsv")}
              className="flex items-center"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyDataset(browserData)}
              aria-label={t("technologies.copyCsv")}
              className="flex items-center"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 md:items-center gap-4">
            <div className="h-80 flex items-center justify-center">
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
      <Card className="shadow-neutral-50 gap-0 py-0">
        <CardHeader className="bg-secondary text-primary py-4 rounded-t-xl flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            {t("technologies.os")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openJson(osData)}
              aria-label={t("technologies.viewJson")}
              className="flex items-center"
            >
              <FileJson className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadDataset(osData, "os.csv")}
              aria-label={t("technologies.downloadCsv")}
              className="flex items-center"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyDataset(osData)}
              aria-label={t("technologies.copyCsv")}
              className="flex items-center"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 md:items-center gap-4">
            <div className="h-80 flex items-center justify-center">
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
      <Card className="shadow-neutral-50 gap-0 py-0">
        <CardHeader className="bg-secondary text-primary py-4 rounded-t-xl flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            {t("technologies.device")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openJson(deviceData)}
              aria-label={t("technologies.viewJson")}
              className="flex items-center"
            >
              <FileJson className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadDataset(deviceData, "devices.csv")}
              aria-label={t("technologies.downloadCsv")}
              className="flex items-center"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyDataset(deviceData)}
              aria-label={t("technologies.copyCsv")}
              className="flex items-center"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 md:items-center gap-4">
            <div className="h-80 flex items-center justify-center">
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
        data={jsonData}
        isOpen={jsonOpen}
        onClose={() => setJsonOpen(false)}
      />
    </div>
  );
}
