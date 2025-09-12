import { useCallback, useEffect, useMemo, useState } from "react";
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
  Skeleton,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@kitejs-cms/dashboard-core";
import type { AnalyticsAggregateResponseModel } from "@kitejs-cms/plugin-analytics-api";
import { DatePicker } from "../components/date-picker";
import { FileJson, Download, Copy, BarChart3 } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from "recharts";

export const CHART_COLORS = Array.from(
  { length: 10 },
  (_, i) => `var(--chart-${i + 1})`
);

export function AnalyticsEventsPage() {
  const { t } = useTranslation("analytics");
  const { setBreadcrumb } = useBreadcrumb();
  const { data, fetchData, loading } = useApi<AnalyticsAggregateResponseModel>();

  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  }));

  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonData, setJsonData] = useState<object>({});

  const loadEvents = useCallback(() => {
    if (!range?.from || !range?.to) return;
    const params = new URLSearchParams({
      startDate: range.from.toISOString().slice(0, 10),
      endDate: range.to.toISOString().slice(0, 10),
    });
    fetchData(`analytics/events/aggregate?${params.toString()}`);
  }, [fetchData, range]);

  useEffect(() => {
    setBreadcrumb([
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.analytics"), path: "/analytics" },
      { label: t("breadcrumb.events"), path: "/analytics/events" },
    ]);
  }, [setBreadcrumb, t]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const eventsData = useMemo(() => {
    const entries = Object.entries(data?.eventsByIdentifier ?? {});
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    return entries.map(([key, count]) => ({
      key,
      count,
      percentage: total ? +((count / total) * 100).toFixed(2) : 0,
    }));
  }, [data]);

  const datasetToCsv = (
    dataset: Record<string, string | number>[]
  ): string => {
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

  return (
    <div className="space-y-6 p-4">
      <DatePicker value={range} onValueChange={setRange} />

      <Card className="shadow-neutral-50 gap-0 py-0">
        <CardHeader className="bg-secondary text-primary py-4 rounded-t-xl flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t("events.title")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openJson(eventsData)}
              aria-label={t("technologies.viewJson")}
              className="flex items-center"
            >
              <FileJson className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadDataset(eventsData, "events.csv")}
              aria-label={t("technologies.downloadCsv")}
              className="flex items-center"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyDataset(eventsData)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 md:items-center gap-4">
              <Skeleton className="h-80 w-full" />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("events.identifier")}</TableHead>
                    <TableHead className="text-right">
                      {t("technologies.count")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("technologies.percentage")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-16 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-16 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 md:items-center gap-4">
              <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={eventsData}
                      dataKey="percentage"
                      nameKey="key"
                      innerRadius="40%"
                      outerRadius="80%"
                      label={({ value }) => `${value.toFixed(1)}%`}
                    >
                      {eventsData.map((_, index) => (
                        <Cell
                          key={`event-cell-${index}`}
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
                data={eventsData}
                columns={[
                  { key: "key" as never, label: t("events.identifier") },
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

