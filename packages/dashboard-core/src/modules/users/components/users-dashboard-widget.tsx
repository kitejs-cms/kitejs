import { useEffect } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useApi } from "../../../hooks/use-api";

interface UserStats {
  total: number;
  registrations: { date: string; count: number }[];
  trend: number;
}

function Sparkline({ data }: { data: number[] }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((d - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}

export function UsersDashboardWidget() {
  const { data, fetchData } = useApi<UserStats>();

  useEffect(() => {
    fetchData("users/stats");
  }, [fetchData]);

  const trendUp = (data?.trend ?? 0) >= 0;
  const TrendIcon = trendUp ? ArrowUpRight : ArrowDownRight;

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
          <Sparkline
            data={(data?.registrations || []).map((r) => r.count)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
