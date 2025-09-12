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
  useSettingsContext,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  Input,
} from "@kitejs-cms/dashboard-core";
import type {
  AnalyticsAggregateResponseModel,
  AnalyticsPluginSettingsModel,
} from "@kitejs-cms/plugin-analytics-api";
import {
  ANALYTICS_PLUGIN_NAMESPACE,
  ANALYTICS_SETTINGS_KEY,
} from "../module";
import { DatePicker } from "../components/date-picker";
import { AnalyticsSkeleton } from "../components/analytics-skeleton";
import { FileJson, Download, Copy, Tag, Pencil } from "lucide-react";
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
  const { getSetting, updateSetting } = useSettingsContext();

  const [pluginSettings, setPluginSettings] =
    useState<AnalyticsPluginSettingsModel | null>(null);
  const [typeLabels, setTypeLabels] = useState<Record<string, string>>({});

  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  }));

  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonData, setJsonData] = useState<object>({});
  const [editType, setEditType] = useState<string | null>(null);
  const [editLabelValue, setEditLabelValue] = useState("");

  useEffect(() => {
    const loadLabels = async () => {
      const res = await getSetting<{ value: AnalyticsPluginSettingsModel }>(
        ANALYTICS_PLUGIN_NAMESPACE,
        ANALYTICS_SETTINGS_KEY
      );
      if (res?.value) {
        setPluginSettings(res.value);
        setTypeLabels(res.value.eventTypeLabels ?? {});
      }
    };
    loadLabels();
  }, [getSetting]);

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

  const typeCards = useMemo(
    () =>
      Object.entries(data?.eventsByType ?? {}).map(([type, value]) => {
        const entries = Object.entries(value.identifiers ?? {});
        const total = entries.reduce((sum, [, v]) => sum + v.count, 0);
        const dataset = entries.map(([key, v]) => ({
          key,
          count: v.count,
          duration: v.duration,
          percentage: total ? +((v.count / total) * 100).toFixed(2) : 0,
        }));
        return {
          type,
          label: typeLabels[type] ?? type,
          count: value.count,
          duration: value.duration,
          dataset,
        };
      }),
    [data, typeLabels]
  );

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

  const startEditLabel = (type: string) => {
    setEditType(type);
    setEditLabelValue(typeLabels[type] ?? type);
  };

  const saveEditLabel = async () => {
    if (!editType) return;
    const newLabels = { ...typeLabels, [editType]: editLabelValue };
    setTypeLabels(newLabels);
    const newSettings: AnalyticsPluginSettingsModel = {
      ...(pluginSettings ?? { apiKey: "", retentionDays: 0 }),
      eventTypeLabels: newLabels,
    };
    setPluginSettings(newSettings);
    try {
      await updateSetting(
        ANALYTICS_PLUGIN_NAMESPACE,
        ANALYTICS_SETTINGS_KEY,
        newSettings
      );
    } catch (err) {
      console.error("Failed to update event label", err);
    }
    setEditType(null);
  };

  return (
    <div className="space-y-6 p-4">
      <DatePicker value={range} onValueChange={setRange} />

      {typeCards.map(({ type, label, dataset, count, duration }) => (
        <Card key={type} className="shadow-neutral-50 gap-0 py-0">
          <CardHeader className="bg-secondary text-primary py-4 rounded-t-xl flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              {t("events.typeCardTitle", { type: label })}
              <span className="text-sm font-normal text-muted-foreground">
                {count}
                {typeof duration === "number" && ` • ${duration.toFixed(2)}s`}
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startEditLabel(type)}
                aria-label={t("events.editLabel")}
                className="flex items-center"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openJson(dataset)}
                aria-label={t("technologies.viewJson")}
                className="flex items-center"
              >
                <FileJson className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadDataset(dataset, `${type}.csv`)}
                aria-label={t("technologies.downloadCsv")}
                className="flex items-center"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyDataset(dataset)}
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
                  t("events.identifier"),
                  t("technologies.count"),
                  t("events.duration"),
                  t("technologies.percentage"),
                ]}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 md:items-center gap-4">
                <div className="h-80 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dataset}
                        dataKey="percentage"
                        nameKey="key"
                        innerRadius="40%"
                        outerRadius="80%"
                        label={({ value }) => `${value.toFixed(1)}%`}
                      >
                        {dataset.map((_, index) => (
                          <Cell
                            key={`${type}-cell-${index}`}
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
                  duration?: number;
                  percentage: number;
                }>
                  data={dataset}
                  columns={[
                    { key: "key" as never, label: t("events.identifier") },
                    {
                      key: "count" as never,
                      label: t("technologies.count"),
                      align: "right",
                    },
                    {
                      key: "duration" as never,
                      label: t("events.duration"),
                      align: "right",
                      render: (value) =>
                        typeof value === "number" ? value.toFixed(2) : "-",
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
      ))}

      <AlertDialog
        open={editType !== null}
        onOpenChange={(open) => {
          if (!open) setEditType(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("events.editLabel")}</AlertDialogTitle>
          </AlertDialogHeader>
          <Input
            value={editLabelValue}
            onChange={(e) => setEditLabelValue(e.target.value)}
            placeholder={t("events.editLabelPrompt") || ""}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>{t("events.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={saveEditLabel}>
              {t("events.save")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <JsonModal
        data={jsonData}
        isOpen={jsonOpen}
        onClose={() => setJsonOpen(false)}
      />
    </div>
  );
}

