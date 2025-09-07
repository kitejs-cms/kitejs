import { Users } from "lucide-react";
import { DashboardNavigationWidget } from "../../../components/dashboard-navigation-widget";

export function UsersDashboardWidget() {
  return (
    <DashboardNavigationWidget
      title="Utenti"
      description="Gestisci utenti e permessi"
      icon={Users}
      path="/users"
      gradient="from-purple-500 to-purple-600"
    />
  );
}

