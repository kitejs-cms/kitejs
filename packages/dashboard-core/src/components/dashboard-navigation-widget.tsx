import { LucideIcon, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface DashboardNavigationWidgetProps {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  gradient: string;
}

export function DashboardNavigationWidget({
  title,
  description,
  icon: Icon,
  path,
  gradient,
}: DashboardNavigationWidgetProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 group overflow-hidden"
      onClick={() => navigate(path)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div
            className={`p-3 rounded-lg bg-gradient-to-r ${gradient} text-white`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
}

