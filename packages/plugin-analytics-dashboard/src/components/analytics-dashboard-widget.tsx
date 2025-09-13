import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3, Users, UserPlus } from "lucide-react";
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
      <CardHeader>
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
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 -mt-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-2">
          <div className="rounded-2xl border bg-card p-4 md:min-w-[120px]">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{t("dashboardWidget.totalEvents")}</span>
              <BarChart3 className="h-3.5 w-3.5" />
            </div>
            <div className="mt-0.5 text-base font-semibold leading-none">
              {formatNumber(summary.totalEvents, i18n.language)}
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-4 md:min-w-[120px]">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{t("dashboardWidget.uniqueVisitors")}</span>
              <Users className="h-3.5 w-3.5" />
            </div>
            <div className="mt-0.5 text-base font-semibold leading-none">
              {formatNumber(summary.uniqueVisitors, i18n.language)}
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-4 md:min-w-[120px]">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{t("dashboardWidget.newUsers")}</span>
              <UserPlus className="h-3.5 w-3.5" />
            </div>
            <div className="mt-0.5 text-base font-semibold leading-none">
              {formatNumber(summary.newUsers, i18n.language)}
            </div>
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
