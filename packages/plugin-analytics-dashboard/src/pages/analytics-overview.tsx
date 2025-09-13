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
const geoUrl =
  "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

interface GeoFeature {
  rsmKey: string;
  properties: { ISO_A2: string };
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
  const [mapComponents, setMapComponents] = useState<{
    ComposableMap: React.ComponentType<Record<string, unknown>>;
    Geographies: React.ComponentType<Record<string, unknown>>;
    Geography: React.ComponentType<Record<string, unknown>>;
  } | null>(null);

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
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    const baseUrl = import.meta.env.VITE_API_URL;
    const promises = Array.from({ length: days }).map((_, i) => {
      const d = new Date(range.from!.getTime() + i * 86400000);
      const ds = d.toISOString().slice(0, 10);
      return fetch(`${baseUrl}/analytics/events/summary?startDate=${ds}&endDate=${ds}`, {
        credentials: "include",
      })
        .then((r) => r.json())
        .then((res) => ({
          date: ds,
          active: res.data?.uniqueVisitors ?? 0,
          new: res.data?.newUsers ?? 0,
        }));
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

  useEffect(() => {
    import("https://cdn.skypack.dev/react-simple-maps@3?min").then((mod) => {
      setMapComponents(
        mod as {
          ComposableMap: React.ComponentType<Record<string, unknown>>;
          Geographies: React.ComponentType<Record<string, unknown>>;
          Geography: React.ComponentType<Record<string, unknown>>;
        }
      );
    });
  }, []);

  const maxCountry = Math.max(
    ...Object.values(locations?.countries ?? { none: 0 })
  );

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
              {mapComponents && (
                <mapComponents.ComposableMap projectionConfig={{ scale: 150 }}>
                  <mapComponents.Geographies geography={geoUrl}>
                    {({ geographies }: { geographies: GeoFeature[] }) =>
                      geographies.map((geo) => {
                        const iso = geo.properties.ISO_A2;
                        const val = locations?.countries?.[iso] ?? 0;
                        const fill = val
                          ? `rgba(37,99,235,${0.2 + (val / maxCountry) * 0.8})`
                          : "#EEE";
                        return (
                          <mapComponents.Geography
                            key={geo.rsmKey}
                            geography={geo as unknown as Record<string, unknown>}
                            onClick={() => {
                              setSelectedCountry(iso);
                            }}
                            style={{
                              default: { fill, outline: "none" },
                              hover: { fill: "#999", outline: "none" },
                              pressed: { fill: "#666", outline: "none" },
                            }}
                          />
                        );
                      })
                    }
                  </mapComponents.Geographies>
                </mapComponents.ComposableMap>
              )}
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
