import { DashboardWidgetModel } from "../../../models/dashboard-widget.model";

interface DashboardPageProps {
  widgets?: DashboardWidgetModel[];
}

export function DashboardPage({ widgets = [] }: DashboardPageProps) {

  return (
    <div className="flex h-full w-full flex-col p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Benvenuto nel pannello di controllo. Gestisci i tuoi contenuti e
          utenti.
        </p>
      </div>

      {widgets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets.map((widget) => (
            <div key={widget.key}>{widget.component}</div>
          ))}
        </div>
      )}
    </div>
  );
}
