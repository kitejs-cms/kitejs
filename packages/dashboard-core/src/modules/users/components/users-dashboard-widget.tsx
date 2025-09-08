import { useMemo } from "react";
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
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { useNavigate } from "react-router-dom";

// import { useApi } from "../../../hooks/use-api"; // Uncomment when real API is available

interface UserStats {
  total: number;
  registrations: { date: string; count: number }[];
  trend: number;
}

export function UsersDashboardWidget() {
  const navigate = useNavigate();

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
    return { total: 1234, registrations, trend: 8 };
  }, []);

  const trendUp = data.trend >= 0;
  const TrendIcon = trendUp ? ArrowUpRight : ArrowDownRight;

  const chartData = data.registrations;

  return (
    <Card className="h-full flex flex-col">
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
          <span className="ml-1">{Math.abs(data.trend).toFixed(0)}%</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="text-2xl font-bold">{data.total}</div>
        <div className="mt-4 h-32 w-full text-primary">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, bottom: 0, left: 0, right: 0 }}>
              <defs>
                <linearGradient id="usersTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="text-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="currentColor" />
              <YAxis tick={{ fontSize: 10 }} stroke="currentColor" />
              <Area
                type="monotone"
                dataKey="count"
                stroke="currentColor"
                fill="url(#usersTrend)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 self-start"
          onClick={() => navigate("/users")}
        >
          Gestisci utenti
        </Button>
      </CardContent>
    </Card>
  );
}
