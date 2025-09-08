import { useEffect } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useApi } from "../../../hooks/use-api";

interface UserStats {
  total: number;
  registrations: { date: string; count: number }[];
  trend: number;
}

export function UsersDashboardWidget() {
  const { data, fetchData } = useApi<UserStats>();

  useEffect(() => {
    fetchData("users/stats");
  }, [fetchData]);

  const trendUp = (data?.trend ?? 0) >= 0;
  const TrendIcon = trendUp ? ArrowUpRight : ArrowDownRight;

  const chartData = data?.registrations ?? [];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Utenti
        </CardTitle>
        <div
          className={`flex items-center text-sm ${
            trendUp ? "text-green-500" : "text-red-500"
          }`}
        >
          <TrendIcon className="h-4 w-4" />
          <span className="ml-1">
            {Math.abs(data?.trend ?? 0).toFixed(0)}%
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{data?.total ?? "—"}</div>
        <div className="mt-4 h-16 text-primary">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
              <defs>
                <linearGradient id="usersTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Area type="monotone" dataKey="count" stroke="currentColor" fill="url(#usersTrend)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
