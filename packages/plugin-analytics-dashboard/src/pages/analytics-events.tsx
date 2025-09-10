import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  DataTable,
  useApi,
  useBreadcrumb,
} from "@kitejs-cms/dashboard-core";
import type { AnalyticsEventResponseModel } from "@kitejs-cms/plugin-analytics-api";

export function AnalyticsEventsPage() {
  const { t } = useTranslation("analytics");
  const { setBreadcrumb } = useBreadcrumb();
  const {
    data: events,
    loading: eventsLoading,
    fetchData: fetchEvents,
  } = useApi<{ data: AnalyticsEventResponseModel[] }>();

  useEffect(() => {
    setBreadcrumb([
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.analytics"), path: "/analytics" },
      { label: t("breadcrumb.events"), path: "/analytics/events" },
    ]);
    fetchEvents("analytics/events");
  }, [setBreadcrumb, t, fetchEvents]);

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("events.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<AnalyticsEventResponseModel>
            data={events?.data}
            isLoading={eventsLoading}
            columns={[
              { key: "type" as never, label: t("events.type") },
              {
                key: "createdAt" as never,
                label: t("events.createdAt"),
                render: (v) =>
                  v
                    ? new Intl.DateTimeFormat("it-IT", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      } as Intl.DateTimeFormatOptions).format(
                        new Date(v as string)
                      )
                    : "",
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
