import { useEffect } from "react";
import { Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { useApi } from "../../../hooks/use-api";
import { UserResponseModel } from "@kitejs-cms/core/index";

export function UsersDashboardWidget() {
  const { data, fetchData, loading } = useApi<UserResponseModel[]>();

  useEffect(() => {
    fetchData("users?page[number]=1&page[size]=5");
  }, [fetchData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4" /> Ultimi utenti
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-gray-500">Caricamento...</p>}
        {!loading && data && (
          <ul className="space-y-2">
            {data.map((user) => (
              <li key={user.id} className="text-sm text-gray-700">
                {user.email}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
