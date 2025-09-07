import { FileText } from "lucide-react";
import { DashboardNavigationWidget } from "../../../components/dashboard-navigation-widget";

export function PagesDashboardCard() {
  return (
    <DashboardNavigationWidget
      title="Pagine"
      description="Gestisci le pagine del sito"
      icon={FileText}
      path="/pages"
      gradient="from-blue-500 to-blue-600"
    />
  );
}

