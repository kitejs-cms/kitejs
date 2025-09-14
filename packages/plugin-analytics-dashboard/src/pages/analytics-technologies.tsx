import type { AnalyticsTechnologiesResponseModel } from "@kitejs-cms/plugin-analytics-api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DatePicker } from "../components/date-picker";
import { useTranslation } from "react-i18next";
import type { DateRange } from "react-day-picker";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Separator,
  Button,
  DataTable,
  useApi,
  useBreadcrumb,
  JsonModal,
} from "@kitejs-cms/dashboard-core";
import {
  FileJson,
  Globe,
  Monitor,
  Smartphone,
  Download,
  Copy,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from "recharts";
import { AnalyticsSkeleton } from "../components/analytics-skeleton";

export const CHART_COLORS = Array.from(
  { length: 10 },
  (_, i) => `var(--chart-${i + 1})`
);

export function AnalyticsTechnologiesPage() {
  const { t } = useTranslation("analytics");
  const { setBreadcrumb } = useBreadcrumb();
  const { data, fetchData, loading } =
    useApi<AnalyticsTechnologiesResponseModel>();

  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  }));

  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonData, setJsonData] = useState<object>({});

  const loadTechnologies = useCallback(() => {
    if (!range?.from || !range?.to) return;
    const params = new URLSearchParams({
      startDate: range.from.toISOString().slice(0, 10),
      endDate: range.to.toISOString().slice(0, 10),
    });
    fetchData(`analytics/events/technologies?${params.toString()}`);
  }, [fetchData, range]);

  const datasetToCsv = (dataset: Record<string, string | number>[]) => {
    if (dataset.length === 0) return "";
    const keys = Object.keys(dataset[0] ?? {});
    const rows = dataset.map((row) =>
      keys.map((key) => String(row[key] ?? "")).join(",")
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
    filename: string
  ) => {
    const csv = datasetToCsv(dataset);
    const blob = new Blob([csv], { type: "text/csv" });
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
  }, [setBreadcrumb, t]);

  useEffect(() => {
    loadTechnologies();
  }, [loadTechnologies]);

  const browserData = useMemo(() => {
    const entries = Object.entries(data?.browsers ?? {});
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    return entries.map(([key, count]) => ({
      key,
      count,
      percentage: total ? +((count / total) * 100).toFixed(2) : 0,
    }));
  }, [data]);

  const osData = useMemo(() => {
    const entries = Object.entries(data?.os ?? {});
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    return entries.map(([key, count]) => ({
      key,
      count,
      percentage: total ? +((count / total) * 100).toFixed(2) : 0,
    }));
  }, [data]);

  const deviceData = useMemo(() => {
    const entries = Object.entries(data?.devices ?? {});
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    return entries.map(([key, count]) => ({
      key,
      count,
      percentage: total ? +((count / total) * 100).toFixed(2) : 0,
    }));
  }, [data]);

  return (
    <div className="space-y-6 p-4">
      <DatePicker value={range} onValueChange={setRange} />

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
          {loading ? (
            <AnalyticsSkeleton
              headers={[
                t("technologies.browser"),
                t("technologies.count"),
                t("technologies.percentage"),
              ]}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 md:items-center gap-4">
              <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={browserData}
                      dataKey="percentage"
                      nameKey="key"
                      innerRadius="40%"
                      outerRadius="80%"
                      label={({ value }) => `${value.toFixed(1)}%`}
                    >
                      {browserData.map((_, index) => (
                        <Cell
                          key={`browser-cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <DataTable<{
                key: string;
                count: number;
                percentage: number;
              }>
                data={browserData}
                columns={[
                  { key: "key" as never, label: t("technologies.browser") },
                  {
                    key: "count" as never,
                    label: t("technologies.count"),
                    align: "right",
                  },
                  {
                    key: "percentage" as never,
                    label: t("technologies.percentage"),
                    align: "right",
                    render: (value) =>
                      typeof value === "number" ? `${value.toFixed(2)}%` : value,
                  },
                ]}
              />
            </div>
          )}
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
          {loading ? (
            <AnalyticsSkeleton
              headers={[
                t("technologies.os"),
                t("technologies.count"),
                t("technologies.percentage"),
              ]}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 md:items-center gap-4">
              <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={osData}
                      dataKey="percentage"
                      nameKey="key"
                      innerRadius="40%"
                      outerRadius="80%"
                      label={({ value }) => `${value.toFixed(1)}%`}
                    >
                      {osData.map((_, index) => (
                        <Cell
                          key={`os-cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <DataTable<{
                key: string;
                count: number;
                percentage: number;
              }>
                data={osData}
                columns={[
                  { key: "key" as never, label: t("technologies.os") },
                  {
                    key: "count" as never,
                    label: t("technologies.count"),
                    align: "right",
                  },
                  {
                    key: "percentage" as never,
                    label: t("technologies.percentage"),
                    align: "right",
                    render: (value) =>
                      typeof value === "number" ? `${value.toFixed(2)}%` : value,
                  },
                ]}
              />
            </div>
          )}
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
          {loading ? (
            <AnalyticsSkeleton
              headers={[
                t("technologies.device"),
                t("technologies.count"),
                t("technologies.percentage"),
              ]}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 md:items-center gap-4">
              <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      dataKey="percentage"
                      nameKey="key"
                      innerRadius="40%"
                      outerRadius="80%"
                      label={({ value }) => `${value.toFixed(1)}%`}
                    >
                      {deviceData.map((_, index) => (
                        <Cell
                          key={`device-cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <DataTable<{
                key: string;
                count: number;
                percentage: number;
              }>
                data={deviceData}
                columns={[
                  { key: "key" as never, label: t("technologies.device") },
                  {
                    key: "count" as never,
                    label: t("technologies.count"),
                    align: "right",
                  },
                  {
                    key: "percentage" as never,
                    label: t("technologies.percentage"),
                    align: "right",
                    render: (value) =>
                      typeof value === "number" ? `${value.toFixed(2)}%` : value,
                  },
                ]}
              />
            </div>
          )}
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
