import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DateRange } from "react-day-picker";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
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
} from "recharts";
// Basic lat/long positions for a subset of countries used to plot events
const COUNTRY_POSITIONS: Record<string, [number, number]> = {
  US: [-98.35, 39.5],
  CA: [-106.35, 56.13],
  BR: [-51.93, -14.24],
  GB: [-3.43, 55.38],
  FR: [2.21, 46.23],
  DE: [10.45, 51.17],
  IT: [12.57, 42.77],
  ES: [-3.75, 40.46],
  RU: [105.32, 61.52],
  CN: [104.19, 35.86],
  IN: [78.96, 20.59],
  AU: [133.78, -25.27],
  JP: [138.25, 36.20],
  ZA: [22.94, -30.56],
  EG: [30.80, 26.82],
};

function project([lon, lat]: [number, number], width: number, height: number) {
  return [((lon + 180) * width) / 360, ((90 - lat) * height) / 180];
}

export function AnalyticsOverviewPage() {
  const { t } = useTranslation("analytics");
  const { setBreadcrumb } = useBreadcrumb();
  const hasPermission = useHasPermission();

  const { fetchData: fetchSummary } = useApi<AnalyticsSummaryResponseModel>();
  const {
    data: locations,
    fetchData: fetchLocations,
  } = useApi<AnalyticsLocationsResponseModel>();

  const [summary, setSummary] =
    useState<AnalyticsSummaryResponseModel | null>(null);
  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    to: new Date(),
  }));
  const [chartData, setChartData] = useState<
    { date: string; active: number; new: number }[]
  >([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

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
    if (data) setSummary(data);

    const days =
      Math.floor((range.to.getTime() - range.from.getTime()) / 86400000) + 1;
    const promises = Array.from({ length: days }).map(async (_, i) => {
      const d = new Date(range.from!.getTime() + i * 86400000);
      const ds = d.toISOString().slice(0, 10);
      const { data } = await fetchSummary(
        `analytics/events/summary?startDate=${ds}&endDate=${ds}`
      );
      return {
        date: ds,
        active: data?.uniqueVisitors ?? 0,
        new: data?.newUsers ?? 0,
      };
    });
    const results = await Promise.all(promises);
    setChartData(results);
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

  const maxCountry =
    Math.max(...Object.values(locations?.countries ?? { none: 0 })) || 1;

  return (
    <div className="space-y-4 p-4">
      <DatePicker value={range} onValueChange={setRange} />

      {hasPermission("analytics:summary.read") && (
        <Card>
          <CardHeader>
            <CardTitle>{t("summary.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div>
                {t("summary.activeUsers")}: {summary?.uniqueVisitors ?? "-"}
              </div>
              <div>
                {t("summary.newUsers")}: {summary?.newUsers ?? "-"}
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line
                    type="monotone"
                    dataKey="active"
                    stroke="var(--chart-1)"
                    name={t("summary.activeUsers")}
                  />
                  <Line
                    type="monotone"
                    dataKey="new"
                    stroke="var(--chart-2)"
                    name={t("summary.newUsers")}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {hasPermission("analytics:events.read") && (
        <Card>
          <CardHeader>
            <CardTitle>{t("summary.locations")}</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex-1 h-80">
              <svg viewBox="0 0 360 180" className="w-full h-full bg-gray-100">
                {Object.entries(locations?.countries ?? {}).map(([iso, count]) => {
                  const coords = COUNTRY_POSITIONS[iso];
                  if (!coords) return null;
                  const [cx, cy] = project(coords, 360, 180);
                  const r = 3 + (count / maxCountry) * 7;
                  const fill = `rgba(37,99,235,0.7)`;
                  return (
                    <circle
                      key={iso}
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill={fill}
                      stroke="#fff"
                      onClick={() => setSelectedCountry(iso)}
                    />
                  );
                })}
              </svg>
            </div>
            {selectedCountry && locations?.cities && (
              <div className="w-64 overflow-y-auto">
                <h4 className="font-semibold mb-2">{t("summary.cities")}</h4>
                <ul className="space-y-1">
                  {Object.entries(locations.cities).map(([city, count]) => (
                    <li key={city} className="flex justify-between">
                      <span>{city}</span>
                      <span>{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
