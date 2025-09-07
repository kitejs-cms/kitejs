import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { FileText, BookOpen, Users, ArrowRight } from "lucide-react";
import { DashboardWidgetModel } from "../../../models/dashboard-widget.model";

interface DashboardPageProps {
  widgets?: DashboardWidgetModel[];
}

export function DashboardPage({ widgets = [] }: DashboardPageProps) {
  const navigate = useNavigate();

  const dashboardCards = [
    {
      title: "Pagine",
      description: "Gestisci le pagine del sito",
      icon: FileText,
      path: "/pages",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Articoli",
      description: "Crea e modifica articoli del blog",
      icon: BookOpen,
      path: "/articles",
      gradient: "from-green-500 to-green-600",
    },
    {
      title: "Utenti",
      description: "Gestisci utenti e permessi",
      icon: Users,
      path: "/users",
      gradient: "from-purple-500 to-purple-600",
    },
  ];

  const handleCardClick = (path: string) => {
    navigate(path);
  };

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

      {/* Main Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <Card
              key={card.title}
              className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 group overflow-hidden"
              onClick={() => handleCardClick(card.path)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`p-3 rounded-lg bg-gradient-to-r ${card.gradient} text-white`}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                  {card.title}
                </CardTitle>
                <p className="text-sm text-gray-600">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Widgets Section */}
      {widgets.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets.map((widget) => (
            <div key={widget.key}>{widget.component}</div>
          ))}
        </div>
      )}
    </div>
  );
}
