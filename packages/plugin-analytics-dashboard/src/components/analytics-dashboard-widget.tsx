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

interface AnalyticsSummary {
  totalEvents: number;
  uniqueVisitors: number;
  newUsers: number;
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
    data ?? { totalEvents: 0, uniqueVisitors: 0, newUsers: 0 };

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
      <CardContent className="grid grid-cols-2 gap-4 pt-0">
        <div className="text-center">
          <p className="text-[11px] text-muted-foreground">
            {t("dashboardWidget.uniqueVisitors")}
          </p>
          <p className="text-base font-semibold">
            {formatNumber(summary.uniqueVisitors, i18n.language)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-muted-foreground">
            {t("dashboardWidget.newUsers")}
          </p>
          <p className="text-base font-semibold">
            {formatNumber(summary.newUsers, i18n.language)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default AnalyticsDashboardWidget;
