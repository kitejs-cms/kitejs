import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useBreadcrumb } from "../../../context/breadcrumb-context";
import {
  MoreVertical,
  Edit,
  Code,
  Clipboard,
  Download,
  Search,
  Plus,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useClipboardTable } from "../../../hooks/use-clipboard-table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Separator } from "../../../components/ui/separator";
import { DataTable } from "../../../components/data-table";
import { useApi } from "../../../hooks/use-api";
import { UserResponseModel } from "@kitejs/core/index";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { Input } from "../../../components/ui/input";

export function UsersManagePage() {
  const { setBreadcrumb } = useBreadcrumb();
  const { copyTable } = useClipboardTable();
  const [showSearch, setShowSearch] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation("users");
  const navigate = useNavigate();

  const itemsPerPage = 10;
  const currentPage = parseInt(searchParams.get("page") || "1");
  const searchQuery = searchParams.get("search") || "";

  const { data, loading, fetchData, pagination } =
    useApi<UserResponseModel[]>();

  useEffect(() => {
    setBreadcrumb([
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.users"), path: "/users" },
    ]);
  }, [setBreadcrumb, t]);

  useEffect(() => {
    const queryParams = new URLSearchParams();
    if (currentPage > 1) queryParams.set("page", currentPage.toString());
    if (searchQuery) queryParams.set("search", searchQuery);
    setSearchParams(queryParams, { replace: true });

    fetchData(
      `users?page=${currentPage}&itemsPerPage=${itemsPerPage}${searchQuery ? `&search=${searchQuery}` : ""}`
    );
  }, [fetchData, currentPage, searchQuery, setSearchParams, searchParams]);

  const handleCopy = () => {
    if (!data) return;
    copyTable(data, [
      { key: "email", label: t("fields.email") },
      { key: "firstName", label: t("fields.firstName") },
      { key: "lastName", label: t("fields.lastName") },
      { key: "status", label: t("fields.status") },
      { key: "createdAt", label: t("fields.createdAt") },
    ]);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full shadow-neutral-50 gap-0 py-0">
        <CardHeader className="bg-secondary text-primary py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <CardTitle>{t("title.manageUsers")}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="cursor-pointer shadow-none bg-neutral-100"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search className="h-4 w-4 text-neutral-500" />
              </Button>
              {showSearch && (
                <div className="transform transition-all duration-500 ease-in-out origin-right">
                  <Input
                    type="text"
                    placeholder={t("search.placeholder")}
                    className="w-[200px] animate-in fade-in slide-in-from-right-1 duration-300 bg-white shadow-muted"
                    value={searchQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      const queryParams = new URLSearchParams(searchParams);
                      if (value) {
                        queryParams.set("search", value);
                      } else {
                        queryParams.delete("search");
                      }
                      queryParams.set("page", "1");
                      setSearchParams(queryParams);
                    }}
                  />
                </div>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => console.log("Add new user")}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("buttons.add")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopy}>
                    <Clipboard className="mr-2 h-4 w-4" />
                    {t("buttons.copy")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => console.log(t("buttons.download"))}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {t("buttons.download")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0 text-sm">
          <DataTable<UserResponseModel>
            data={data}
            isLoading={loading}
            columns={[
              { key: "email", label: t("fields.email") },
              { key: "firstName", label: t("fields.firstName") },
              { key: "lastName", label: t("fields.lastName") },
              { key: "status", label: t("fields.status") },
              {
                key: "createdAt",
                label: t("fields.createdAt"),
                render: (value) =>
                  new Intl.DateTimeFormat("it-IT", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(value as string)),
              },
              {
                key: "id",
                label: t("fields.actions"),
                render: (_, row) => (
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
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/users/${row.id}?view=edit`);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        {t("buttons.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/users/${row.id}?view=json`);
                        }}
                      >
                        <Code className="mr-2 h-4 w-4" />
                        {t("buttons.viewJson")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ),
              },
            ]}
            pagination={{
              currentPage: pagination?.currentPage,
              totalPages: pagination?.totalPages,
              onPageChange: (page) => {
                fetchData(`users?page=${page}&itemsPerPage=${itemsPerPage}`);
                searchParams.set("page", page.toString());
              },
            }}
            onRowClick={(row) => navigate(`/users/${row.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
