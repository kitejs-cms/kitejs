import { useEffect } from "react";
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
import { useNavigate } from "react-router-dom";
import { useApi } from "../../../hooks/use-api";

interface UserStats {
  total: number;
  registrations: { date: string; count: number }[];
  trend: number;
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
  const { data, fetchData } = useApi<UserStats>();

  useEffect(() => {
    fetchData("users/stats");
  }, [fetchData]);

  const stats: UserStats = data ?? {
    total: 0,
    registrations: [],
    trend: 0,
  };

  const trendUp = stats.trend >= 0;
  const TrendIcon = trendUp ? ArrowUpRight : ArrowDownRight;
  const chartData = stats.registrations;

  // KPIs
  const last7 = chartData.slice(-7).reduce((s, d) => s + d.count, 0);
  const last30 = chartData.reduce((s, d) => s + d.count, 0);
  const avgDaily = chartData.length ? last30 / chartData.length : 0;
  const bestDay = chartData.reduce(
    (max, cur) => (cur.count > max.count ? cur : max),
    chartData[0] ?? { date: "", count: 0 }
  );
  const prev7 = chartData.slice(-14, -7).reduce((s, d) => s + d.count, 0);
  const delta7Pct = prev7 === 0 ? 0 : ((last7 - prev7) / prev7) * 100;

  const goUsers = () => navigate("/users");

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="">
        <div className="flex items-start justify-between gap-1.5">
          {/* title + subtitle + micro-trend */}
          <div className="flex items-center gap-2">
            <div className="p-3 rounded-lg bg-gradient-to-r from-gray-400 to-gray-600 text-white">
              <Users className="h-6 w-6" />
            </div>
            <div className="flex flex-col pl-2">
              <CardTitle
                role="button"
                onClick={goUsers}
                className="text-sm font-semibold hover:underline cursor-pointer"
                title={t("dashboardWidget.manage")}
              >
                {t("dashboardWidget.title")}
              </CardTitle>

              <div className="flex items-center gap-1.5">
                <p className="text-[11px] text-muted-foreground">
                  {t("dashboardWidget.last30Days")}
                </p>
                <span
                  className={`inline-flex items-center gap-1 h-4 rounded-full px-1.5 text-[11px] font-medium border ${
                    trendUp
                      ? "text-emerald-600 border-emerald-200 bg-emerald-50"
                      : "text-red-600 border-red-200 bg-red-50"
                  }`}
                  aria-label={t("dashboardWidget.trendTooltip")}
                  title={t("dashboardWidget.trendTooltip")}
                >
                  <TrendIcon className="h-3 w-3" />
                  {Math.abs(stats.trend).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Destra: totale (cliccabile) */}
          <div className="text-right">
            <button
              onClick={goUsers}
              className="text-2xl md:text-3xl font-bold leading-tight hover:underline cursor-pointer"
              aria-label={t("dashboardWidget.manage")}
              title={t("dashboardWidget.manage")}
            >
              {formatNumber(stats.total, i18n.language)}
            </button>
            <p className="text-[11px] text-muted-foreground">
              {t("dashboardWidget.totalUsers")}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-2 -mt-1">
        {/* KPI compatte */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-2">
          <div className="rounded-2xl border bg-card p-4 md:min-w-[120px]">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{t("dashboardWidget.last7Days")}</span>
              <BarChart className="h-3.5 w-3.5" />
            </div>
            <div className="mt-0.5 text-base font-semibold leading-none">
              {formatNumber(last7, i18n.language)}
            </div>
            <div
              className={`mt-0.5 text-[11px] ${
                delta7Pct >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {t("dashboardWidget.delta7", {
                value: `${delta7Pct >= 0 ? "+" : ""}${delta7Pct.toFixed(1)}`,
              })}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 md:min-w-[120px]">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{t("dashboardWidget.avgPerDay")}</span>
              <Users className="h-3.5 w-3.5" />
            </div>
            <div className="mt-0.5 text-base font-semibold leading-none">
              {formatNumber(Math.round(avgDaily), i18n.language)}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {t("dashboardWidget.per30Days")}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 md:min-w-[140px]">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{t("dashboardWidget.bestDay")}</span>
              <CalendarDays className="h-3.5 w-3.5" />
            </div>
            <div className="mt-0.5 text-base font-semibold leading-none">
              {formatNumber(bestDay.count, i18n.language)}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div
          className="flex-1 w-full text-primary min-h-[200px] mt-2 hidden md:block"
          aria-label={t("dashboardWidget.chartAriaLabel")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 6, bottom: 0, left: 0, right: 0 }}
            >
              <defs>
                {/* gradiente neutro */}
                <linearGradient id="usersTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6B7280" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#6B7280" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="#6B7280"
                strokeOpacity={0.07}
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="date"
                tick={false}
                axisLine={false}
                tickLine={false}
                tickFormatter={(d) => formatDateISO(d, i18n.language)}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                stroke="#6B7280"
                width={26}
                axisLine={false}
              />
              <RechartsTooltip
                cursor={{ strokeOpacity: 0.2 }}
                contentStyle={{
                  borderRadius: 10,
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
                stroke="#6B7280"
                strokeWidth={1.75}
                fill="url(#usersTrend)"
                activeDot={{ r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
