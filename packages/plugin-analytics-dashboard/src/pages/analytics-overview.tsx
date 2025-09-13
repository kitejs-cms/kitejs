import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DateRange } from "react-day-picker";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Separator,
  Button,
  JsonModal,
  useApi,
  useBreadcrumb,
  useHasPermission,
} from "@kitejs-cms/dashboard-core";
import type {
  AnalyticsSummaryResponseModel,
  AnalyticsLocationsResponseModel,
} from "@kitejs-cms/plugin-analytics-api";
import { DatePicker } from "../components/date-picker";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";
import { FileJson, Users, UserPlus } from "lucide-react";
import { WorldChoroplethD3 } from "../components/world-choropleth-d3";

export function AnalyticsOverviewPage() {
  const { t, i18n } = useTranslation("analytics");
  const { setBreadcrumb } = useBreadcrumb();
  const hasPermission = useHasPermission();

  const { fetchData: fetchSummary } = useApi<AnalyticsSummaryResponseModel>();
  const { data: locations, fetchData: fetchLocations } =
    useApi<AnalyticsLocationsResponseModel>();

  const [summary, setSummary] = useState<AnalyticsSummaryResponseModel | null>(
    null
  );
  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    to: new Date(),
  }));
  const [chartData, setChartData] = useState<
    { date: string; active: number; new: number }[]
  >([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonData, setJsonData] = useState<object>({});

  const openJson = (data: object) => {
    setJsonData(data);
    setJsonOpen(true);
  };

  useEffect(() => {
    setBreadcrumb([
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.analytics"), path: "/analytics" },
    ]);
  }, [setBreadcrumb, t]);

  const loadSummary = useCallback(async () => {
    if (!range?.from || !range?.to || !hasPermission("analytics:summary.read"))
      return;
    const start = range.from.toISOString().slice(0, 10);
    const end = range.to.toISOString().slice(0, 10);
    const { data } = await fetchSummary(
      `analytics/events/summary?startDate=${start}&endDate=${end}`
    );
    if (data) {
      setSummary(data);
      setChartData(
        (data.daily ?? []).map((d) => ({
          date: d.date,
          active: d.uniqueVisitors,
          new: d.newUsers,
        }))
      );
    }
  }, [range, fetchSummary, hasPermission]);

  const loadLocations = useCallback(() => {
    if (!range?.from || !range?.to || !hasPermission("analytics:events.read"))
      return;
    const params = new URLSearchParams({
      startDate: range.from.toISOString().slice(0, 10),
      endDate: range.to.toISOString().slice(0, 10),
    });
    if (selectedCountry) params.set("country", selectedCountry);
    fetchLocations(`analytics/events/locations?${params.toString()}`);
  }, [range, fetchLocations, selectedCountry, hasPermission]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  return (
    <div className="space-y-6 p-4">
      <DatePicker value={range} onValueChange={setRange} />

      <div className="grid gap-6 md:grid-cols-1">
        {hasPermission("analytics:summary.read") && (
          <Card className="shadow-neutral-50 gap-0 py-0">
            <CardHeader className="bg-secondary text-primary py-4 rounded-t-xl flex flex-row items-center justify-between space-y-0">
              <CardTitle>{t("summary.title")}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openJson(summary ?? {})}
                aria-label={t("technologies.viewJson")}
                className="flex items-center"
              >
                <FileJson className="h-4 w-4" />
              </Button>
            </CardHeader>
            <Separator />
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-2xl border bg-card p-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground">
                      {t("summary.activeUsers")}
                    </span>
                    <span className="mt-0.5 text-base font-semibold leading-none">
                      {summary?.uniqueVisitors?.toLocaleString(i18n.language) ??
                        "-"}
                    </span>
                  </div>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="rounded-2xl border bg-card p-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground">
                      {t("summary.newUsers")}
                    </span>
                    <span className="mt-0.5 text-base font-semibold leading-none">
                      {summary?.newUsers?.toLocaleString(i18n.language) ?? "-"}
                    </span>
                  </div>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      stroke="#6B7280"
                      width={26}
                    />
                    <RechartsTooltip
                      labelFormatter={(label) =>
                        new Date(label as string).toLocaleDateString()
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="active"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      dot={false}
                      name={t("summary.activeUsers")}
                    />
                    <Line
                      type="monotone"
                      dataKey="new"
                      stroke="var(--chart-2)"
                      strokeWidth={2}
                      dot={false}
                      name={t("summary.newUsers")}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {hasPermission("analytics:events.read") && (
          <Card className="shadow-neutral-50 gap-0 py-0">
            <CardHeader className="bg-secondary text-primary py-4 rounded-t-xl flex flex-row items-center justify-between space-y-0">
              <CardTitle>{t("summary.locations")}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openJson(locations ?? {})}
                aria-label={t("technologies.viewJson")}
                className="flex items-center"
              >
                <FileJson className="h-4 w-4" />
              </Button>
            </CardHeader>
            <Separator />
            <CardContent className="p-6 flex gap-4">
              <WorldChoroplethD3 data={locations ? locations.countries : {}} />
            </CardContent>
          </Card>
        )}
      </div>

      <JsonModal
        data={jsonData}
        isOpen={jsonOpen}
        onClose={() => setJsonOpen(false)}
      />
    </div>
  );
}
