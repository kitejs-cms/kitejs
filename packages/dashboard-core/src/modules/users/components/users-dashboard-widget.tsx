import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowDownRight,
  ArrowUpRight,
  Users,
  CalendarDays,
  BarChart,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { useNavigate } from "react-router-dom";

// import { useApi } from "../../../hooks/use-api"; // Uncomment when real API is available

interface UserStats {
  total: number;
  registrations: { date: string; count: number }[];
  trend: number; // % vs periodo precedente
}

function formatNumber(n: number, locale: string) {
  return new Intl.NumberFormat(locale).format(n);
}

function formatDateISO(iso: string, locale: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
}

export function UsersDashboardWidget() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("users");

  // const { data, fetchData } = useApi<UserStats>();
  // useEffect(() => {
  //   fetchData("users/stats");
  // }, [fetchData]);

  const data = useMemo<UserStats>(() => {
    const registrations = Array.from({ length: 30 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().slice(0, 10),
        count: Math.round(10 + 5 * Math.sin(i / 5)),
      };
    });

    // trend fittizio vs i 30 giorni precedenti
    return { total: 1234, registrations, trend: 8 };
  }, []);

  const trendUp = data.trend >= 0;
  const TrendIcon = trendUp ? ArrowUpRight : ArrowDownRight;

  const chartData = data.registrations;

  // --- Derived KPIs ---
  const last7 = chartData.slice(-7).reduce((s, d) => s + d.count, 0);
  const last30 = chartData.reduce((s, d) => s + d.count, 0);
  const avgDaily = last30 / (chartData.length || 1);
  const bestDay = chartData.reduce(
    (max, cur) => (cur.count > max.count ? cur : max),
    chartData[0]
  );

  // 7d vs 7d previous
  const prev7 = chartData.slice(-14, -7).reduce((s, d) => s + d.count, 0);
  const delta7Pct = prev7 === 0 ? 0 : ((last7 - prev7) / prev7) * 100;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  {t("dashboardWidget.title")}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => navigate("/users")}
                >
                  {t("dashboardWidget.manage")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("dashboardWidget.last30Days")}
              </p>
            </div>
          </div>

          <div
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium border ${
              trendUp
                ? "text-emerald-600 border-emerald-200 bg-emerald-50"
                : "text-red-600 border-red-200 bg-red-50"
            }`}
            aria-label={t("dashboardWidget.trendTooltip")}
            title={t("dashboardWidget.trendTooltip")}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            {Math.abs(data.trend).toFixed(0)}%
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col pt-4 gap-4">
        {/* Top row: total + quick KPIs */}
        <div className="flex items-center gap-4 md:justify-between">
          <div>
            <div className="text-3xl md:text-4xl font-bold leading-tight">
              {formatNumber(data.total, i18n.language)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("dashboardWidget.totalUsers")}
            </p>
          </div>

          <div className="hidden gap-3 md:grid md:grid-cols-3">
            <div className="rounded-2xl border bg-card p-3 md:min-w-[120px]">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("dashboardWidget.last7Days")}</span>
                <BarChart className="h-3.5 w-3.5" />
              </div>
              <div className="mt-1 text-lg font-semibold leading-none">
                {formatNumber(last7, i18n.language)}
              </div>
              <div
                className={`mt-1 text-[11px] ${
                  delta7Pct >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {t("dashboardWidget.delta7", {
                  value: `${delta7Pct >= 0 ? "+" : ""}${delta7Pct.toFixed(1)}`,
                })}
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-3 md:min-w-[120px]">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("dashboardWidget.avgPerDay")}</span>
                <Users className="h-3.5 w-3.5" />
              </div>
              <div className="mt-1 text-lg font-semibold leading-none">
                {formatNumber(Math.round(avgDaily), i18n.language)}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {t("dashboardWidget.per30Days")}
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-3 md:min-w-[140px]">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("dashboardWidget.bestDay")}</span>
                <CalendarDays className="h-3.5 w-3.5" />
              </div>
              <div className="mt-1 text-lg font-semibold leading-none">
                {formatNumber(bestDay.count, i18n.language)}
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div
          className="flex-1 w-full text-primary min-h-[180px]"
          aria-label={t("dashboardWidget.chartAriaLabel")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, bottom: 0, left: 0, right: 0 }}
            >
              <defs>
                <linearGradient id="usersTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="currentColor"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="100%"
                    stopColor="currentColor"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="currentColor"
                strokeOpacity={0.08}
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                stroke="currentColor"
                tickFormatter={(d) => formatDateISO(d, i18n.language)}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                stroke="currentColor"
                width={28}
                axisLine={false}
              />
              <RechartsTooltip
                cursor={{ strokeOpacity: 0.2 }}
                contentStyle={{
                  borderRadius: 12,
                  borderColor: "hsl(var(--border))",
                }}
                labelFormatter={(l) =>
                  new Date(l as string).toLocaleDateString(i18n.language, {
                    day: "2-digit",
                    month: "long",
                  })
                }
                formatter={(value: number) => [
                  formatNumber(value, i18n.language),
                  t("dashboardWidget.registrations"),
                ]}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="currentColor"
                strokeWidth={2}
                fill="url(#usersTrend)"
                activeDot={{ r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="pt-1 text-xs text-muted-foreground">
          {t("dashboardWidget.chartCaption", {
            total: formatNumber(last30, i18n.language),
          })}
        </div>
      </CardContent>
    </Card>
  );
}
