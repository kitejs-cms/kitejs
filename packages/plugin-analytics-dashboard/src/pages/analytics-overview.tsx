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
  Skeleton,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  useApi,
  useBreadcrumb,
  useHasPermission,
} from "@kitejs-cms/dashboard-core";
import type {
  AnalyticsSummaryResponseModel,
  AnalyticsLocationsResponseModel,
  AnalyticsSourcesResponseModel,
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { FileJson, Users, UserPlus, MapPinOff } from "lucide-react";
import { WorldChoroplethD3 } from "../components/world-choropleth-d3";

const CHART_COLORS = Array.from(
  { length: 10 },
  (_, i) => `var(--chart-${i + 1})`
);

export function AnalyticsOverviewPage() {
  const { t, i18n } = useTranslation("analytics");
  const { setBreadcrumb } = useBreadcrumb();
  const hasPermission = useHasPermission();

  const { fetchData: fetchSummary, loading: loadingSummary } =
    useApi<AnalyticsSummaryResponseModel>();
  const {
    data: countryLocations,
    fetchData: fetchCountryLocations,
    loading: loadingCountryLocations,
  } = useApi<AnalyticsLocationsResponseModel>();

  const {
    data: cityLocations,
    fetchData: fetchCityLocations,
    loading: loadingCityLocations,
  } = useApi<AnalyticsLocationsResponseModel>();

  const {
    data: sourceData,
    fetchData: fetchSources,
    loading: loadingSources,
  } = useApi<AnalyticsSourcesResponseModel>();

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
  const [selectedCountry, setSelectedCountry] = useState<{
    iso3: string;
    name: string;
  } | null>(null);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonData, setJsonData] = useState<object>({});

  const sourceEntries = Object.entries(sourceData?.sources ?? {});

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
    setSummary(null);
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

  const loadCountries = useCallback(() => {
    if (!range?.from || !range?.to || !hasPermission("analytics:events.read"))
      return;
    const params = new URLSearchParams({
      startDate: range.from.toISOString().slice(0, 10),
      endDate: range.to.toISOString().slice(0, 10),
    });
    fetchCountryLocations(`analytics/events/locations?${params.toString()}`);
  }, [range, fetchCountryLocations, hasPermission]);

  const loadCities = useCallback(() => {
    if (!range?.from || !range?.to || !hasPermission("analytics:events.read"))
      return;
    const params = new URLSearchParams({
      startDate: range.from.toISOString().slice(0, 10),
      endDate: range.to.toISOString().slice(0, 10),
    });
    if (selectedCountry) params.set("country", selectedCountry.iso3);
    fetchCityLocations(`analytics/events/locations?${params.toString()}`);
  }, [range, fetchCityLocations, selectedCountry, hasPermission]);

  const loadSources = useCallback(() => {
    if (!range?.from || !range?.to || !hasPermission("analytics:events.read"))
      return;
    const params = new URLSearchParams({
      startDate: range.from.toISOString().slice(0, 10),
      endDate: range.to.toISOString().slice(0, 10),
    });
    fetchSources(`analytics/events/sources?${params.toString()}`);
  }, [range, fetchSources, hasPermission]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadCountries();
  }, [loadCountries]);

  useEffect(() => {
    loadCities();
  }, [loadCities]);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  return (
    <div className="space-y-6 p-4">
      <DatePicker value={range} onValueChange={setRange} />

      <div className="grid gap-6 md:grid-cols-3">
        {hasPermission("analytics:summary.read") && (
          <Card className="shadow-neutral-50 gap-0 py-0 md:col-span-3 rounded-2xl overflow-hidden">
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
              {loadingSummary || !summary ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-2xl border bg-card p-4 flex items-center justify-between"
                      >
                        <div className="flex flex-col space-y-2">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                        <Skeleton className="h-4 w-4 rounded-full" />
                      </div>
                    ))}
                  </div>
                  <Skeleton className="h-64 w-full" />
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="rounded-2xl border bg-card p-4 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-muted-foreground">
                          {t("summary.activeUsers")}
                        </span>
                        <span className="mt-0.5 text-base font-semibold leading-none">
                          {summary?.uniqueVisitors?.toLocaleString(
                            i18n.language
                          ) ?? "-"}
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
                          {summary?.newUsers?.toLocaleString(i18n.language) ??
                            "-"}
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
                </>
              )}
            </CardContent>
          </Card>
        )}

        {hasPermission("analytics:events.read") && (
          <>
            <Card className="shadow-neutral-50 gap-0 py-0 md:col-span-3 rounded-2xl overflow-hidden">
              <CardHeader className="bg-secondary text-primary py-4 rounded-t-xl flex flex-row items-center justify-between space-y-0">
                <CardTitle>{t("summary.sources")}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openJson(sourceData?.sources ?? {})}
                  aria-label={t("technologies.viewJson")}
                  className="flex items-center"
                >
                  <FileJson className="h-4 w-4" />
                </Button>
              </CardHeader>
              <Separator />
              <CardContent className="p-6">
                {loadingSources ? (
                  <Skeleton className="h-80 w-full" />
                ) : sourceEntries.length > 0 ? (
                  <div className="h-80 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sourceEntries.map(([key, count]) => ({ key, count }))}
                          dataKey="count"
                          nameKey="key"
                          outerRadius="80%"
                        >
                          {sourceEntries.map((_, index) => (
                            <Cell
                              key={index}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-sm text-muted-foreground h-80">
                    {t("summary.noSourceData")}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-neutral-50 gap-0 py-0 md:col-span-2 rounded-2xl overflow-hidden">
              <CardHeader className="bg-secondary text-primary py-4 rounded-t-xl flex flex-row items-center justify-between space-y-0">
                <CardTitle>{t("summary.locations")}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openJson(countryLocations ?? {})}
                  aria-label={t("technologies.viewJson")}
                  className="flex items-center"
                >
                  <FileJson className="h-4 w-4" />
                </Button>
              </CardHeader>
              <Separator />
              <CardContent className="p-4">
                {loadingCountryLocations ? (
                  <Skeleton className="h-80 w-full" />
                ) : (
                  <WorldChoroplethD3
                    data={countryLocations ? countryLocations.countries : {}}
                    onSelectCountry={(iso3, name) =>
                      setSelectedCountry((prev) =>
                        prev?.iso3 === iso3 ? null : { iso3, name }
                      )
                    }
                  />
                )}
              </CardContent>
            </Card>

            <Card className="shadow-neutral-50 gap-0 py-0 md:col-span-1 rounded-2xl overflow-hidden">
              <CardHeader className="bg-secondary text-primary py-4 rounded-t-xl flex flex-row items-center justify-between space-y-0">
                <div className="flex flex-col gap-1">
                  <CardTitle>{t("summary.cities")}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {selectedCountry?.name ?? t("summary.world")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openJson(cityLocations?.cities ?? {})}
                  aria-label={t("technologies.viewJson")}
                  className="flex items-center"
                >
                  <FileJson className="h-4 w-4" />
                </Button>
              </CardHeader>
              <Separator />
              <CardContent className="py-2 max-h-[550px] overflow-y-auto">
                {loadingCityLocations ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">
                          {t("summary.city")}
                        </TableHead>
                        <TableHead className="text-right text-xs">
                          {t("summary.visitors")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="mt-2 h-1 w-full" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-4 w-12 ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : cityLocations?.cities &&
                  Object.keys(cityLocations.cities).length > 0 ? (
                  (() => {
                    const cityEntries = Object.entries(
                      cityLocations.cities
                    ).sort((a, b) => b[1] - a[1]);
                    const maxCount = cityEntries[0]?.[1] ?? 0;
                    return (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">
                              {t("summary.city")}
                            </TableHead>
                            <TableHead className="text-right text-xs">
                              {t("summary.visitors")}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cityEntries.map(([city, count]) => (
                            <TableRow key={city}>
                              <TableCell>
                                <div className="space-y-1 py-1">
                                  <span>{city}</span>
                                  <div className="h-1 w-full rounded bg-muted">
                                    <div
                                      className="h-full rounded bg-blue-300 mt-1"
                                      style={{
                                        width: `${(count / maxCount) * 100}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {count.toLocaleString(i18n.language)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    );
                  })()
                ) : (
                  <div className="flex flex-col items-center justify-center text-sm text-muted-foreground">
                    <MapPinOff className="mb-3 h-22 w-22 mt-8 text-gray-100" />
                    <span className="text-gray-100">
                      {t("summary.noCityData")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
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
