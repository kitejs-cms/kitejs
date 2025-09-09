import { BookOpen } from "lucide-react";
import { DashboardNavigationWidget } from "../../../components/dashboard-navigation-widget";

export function ArticlesDashboardCard() {
  return (
    <DashboardNavigationWidget
      title="Articoli"
      description="Crea e modifica articoli del blog"
      icon={BookOpen}
      path="/articles"
      gradient="from-green-500 to-green-600"
    />
  );
}

