import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBreadcrumb } from "../../../context/breadcrumb-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Separator } from "../../../components/ui/separator";
import { DataTable } from "../../../components/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash, Plus, Code } from "lucide-react";
import { RoleForm } from "../components/role-form";
import { useApi } from "../../../hooks/use-api";
import type { RoleResponseModel } from "@kitejs-cms/core/index";
import { JsonModal } from "../../../components/json-modal";

export function RolesManagePage() {
  const { t } = useTranslation("users");
  const { setBreadcrumb } = useBreadcrumb();
  const { data, loading, fetchData } = useApi<RoleResponseModel[]>();
  const [openForm, setOpenForm] = useState(false);
  const [selectedRole, setSelectedRole] =
    useState<RoleResponseModel | undefined>();
  const [jsonRole, setJsonRole] = useState<RoleResponseModel | null>(null);

  useEffect(() => {
    setBreadcrumb([
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.users"), path: "/users" },
      { label: t("breadcrumb.roles"), path: "/users/roles" },
    ]);
  }, [setBreadcrumb, t]);

  const loadRoles = () => {
    fetchData("roles");
  };

  useEffect(() => {
    loadRoles();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id: string) => {
    await fetchData(`roles/${id}`, "DELETE");
    loadRoles();
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <JsonModal
        data={jsonRole || {}}
        isOpen={!!jsonRole}
        onClose={() => setJsonRole(null)}
      />
      <RoleForm
        role={selectedRole}
        isOpen={openForm}
        onClose={() => setOpenForm(false)}
        onSuccess={() => {
          setSelectedRole(undefined);
          loadRoles();
        }}
      />
      <Card className="w-full shadow-neutral-50 gap-0 py-0">
        <CardHeader className="bg-secondary text-primary py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <CardTitle>{t("title.manageRoles")}</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedRole(undefined);
                    setOpenForm(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("buttons.addRole")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0 text-sm">
          <DataTable<RoleResponseModel>
            data={data}
            isLoading={loading}
            columns={[
              { key: "name", label: t("fields.name") },
              { key: "description", label: t("fields.description") },
              { key: "usersCount", label: t("fields.usersCount") },
              {
                key: "id",
                label: t("fields.actions"),
                render: (_, row) => {
                  const isBase = row.source === "system";
                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="shadow-none"
                          size="icon"
                        >
                          <MoreVertical />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedRole(row);
                            setOpenForm(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          {t("buttons.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setJsonRole(row)}
                        >
                          <Code className="mr-2 h-4 w-4" />
                          {t("buttons.viewJson")}
                        </DropdownMenuItem>
                        {!isBase && (
                          <DropdownMenuItem
                            onClick={() => handleDelete(row.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            {t("buttons.delete")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                },
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

