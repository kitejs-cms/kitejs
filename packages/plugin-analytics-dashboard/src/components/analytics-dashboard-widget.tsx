import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  useApi,
} from "@kitejs-cms/dashboard-core";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";

interface AnalyticsSummary {
  totalEvents: number;
  uniqueVisitors: number;
  newUsers: number;
  daily: { date: string; uniqueVisitors: number; newUsers: number }[];
}

function formatNumber(n: number, locale: string) {
  return new Intl.NumberFormat(locale).format(n);
}

export function AnalyticsDashboardWidget() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("analytics");
  const { data, fetchData } = useApi<AnalyticsSummary>();

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);
    fetchData(`analytics/events/summary?startDate=${startStr}&endDate=${endStr}`);
  }, [fetchData]);

  const summary: AnalyticsSummary =
    data ?? { totalEvents: 0, uniqueVisitors: 0, newUsers: 0, daily: [] };

  const chartData = summary.daily ?? [];

  const goAnalytics = () => navigate("/analytics");

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex items-start justify-between gap-1.5">
        <div className="flex items-center gap-2">
          <div className="p-3 rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 text-white">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div className="flex flex-col pl-2">
            <CardTitle
              role="button"
              onClick={goAnalytics}
              className="text-sm font-semibold hover:underline cursor-pointer"
              title={t("dashboardWidget.viewDetails")}
            >
              {t("dashboardWidget.title")}
            </CardTitle>
            <span className="text-[11px] text-muted-foreground">
              {t("dashboardWidget.last30Days")}
            </span>
          </div>
        </div>
        <div className="text-right">
          <button
            onClick={goAnalytics}
            className="text-2xl md:text-3xl font-bold leading-tight hover:underline cursor-pointer"
            aria-label={t("dashboardWidget.viewDetails")}
            title={t("dashboardWidget.viewDetails")}
          >
            {formatNumber(summary.totalEvents, i18n.language)}
          </button>
          <p className="text-[11px] text-muted-foreground">
            {t("dashboardWidget.totalEvents")}
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 pt-0">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-[11px] text-muted-foreground">
              {t("dashboardWidget.uniqueVisitors")}
            </p>
            <p className="text-base font-semibold">
              {formatNumber(summary.uniqueVisitors, i18n.language)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">
              {t("dashboardWidget.newUsers")}
            </p>
            <p className="text-base font-semibold">
              {formatNumber(summary.newUsers, i18n.language)}
            </p>
          </div>
        </div>
        <div
          className="flex-1 w-full min-h-[100px]"
          aria-label={t("dashboardWidget.trendChartAriaLabel")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, left: 0, right: 0, bottom: 0 }}>
              <CartesianGrid stroke="#6B7280" strokeOpacity={0.1} strokeDasharray="3 3" />
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <RechartsTooltip
                cursor={{ strokeOpacity: 0.2 }}
                contentStyle={{ borderRadius: 10, borderColor: "hsl(var(--border))" }}
                labelFormatter={(l) =>
                  new Date(l as string).toLocaleDateString(i18n.language, {
                    day: "2-digit",
                    month: "long",
                  })
                }
                formatter={(value: number, name) => [
                  formatNumber(value, i18n.language),
                  t(
                    `dashboardWidget.${
                      name === "uniqueVisitors" ? "uniqueVisitors" : "newUsers"
                    }`
                  ),
                ]}
              />
              <Line
                type="monotone"
                dataKey="uniqueVisitors"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="newUsers"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default AnalyticsDashboardWidget;
