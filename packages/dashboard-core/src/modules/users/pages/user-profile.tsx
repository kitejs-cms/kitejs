import { useState, useEffect } from "react";
import { MoreVertical, Edit, Clipboard, Code } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";
import { useBreadcrumb } from "../../../context/breadcrumb-context";
import { ProfileForm } from "../../profile/components/profile-form";
import { Button } from "../../../components/ui/button";
import { useApi } from "../../../hooks/use-api";
import type { UserResponseModel } from "@kitejs-cms/core/index";
import { Separator } from "../../../components/ui/separator";
import { Badge } from "../../../components/ui/badge";
import { JsonModal } from "../../../components/json-modal";
import { useClipboardTable } from "../../../hooks/use-clipboard-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";

export function UserProfilePage() {
  const { copyTable } = useClipboardTable();
  const [jsonView, setJsonView] = useState(false);
  const [profileForm, setProfileForm] = useState(false);
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation("users");
  const { setBreadcrumb } = useBreadcrumb();
  const { data: user, fetchData } = useApi<UserResponseModel>();

  useEffect(() => {
    setBreadcrumb([
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.users"), path: "/users" },
      {
        label: user?.firstName
          ? `${user.firstName} ${user.lastName}`
          : t("breadcrumb.profile"),
        path: `/users/${id}`,
      },
    ]);
  }, [setBreadcrumb, t, id, user]);

  useEffect(() => {
    const mode = searchParams.get("mode");
    const view = searchParams.get("view");
    if (mode === "edit") {
      setProfileForm(true);
    }
    if (view === "json") {
      setJsonView(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (id) {
      fetchData(`users/${id}`);
    }
  }, [id, fetchData]);

  const handleCopy = () => {
    if (!user) return;
    copyTable(
      [user],
      [
        { key: "firstName", label: t("fields.firstName") },
        { key: "lastName", label: t("fields.lastName") },
        { key: "email", label: t("fields.email") },
        { key: "status", label: t("fields.status") },
        { key: "roles", label: t("fields.roles") },
        { key: "createdAt", label: t("fields.createdAt") },
        { key: "updatedAt", label: t("fields.updatedAt") },
      ]
    );
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <JsonModal
        isOpen={jsonView}
        onClose={() => setJsonView(false)}
        data={user}
      />
      <ProfileForm
        user={user}
        isOpen={profileForm}
        onClose={() => setProfileForm(false)}
      />

      <Card className="w-full shadow-neutral-50 gap-0 py-0">
        <CardHeader className="bg-neutral-50 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <CardTitle>
              {user?.firstName} {user?.lastName}
              <CardDescription className="text-xsm font-light pt-0.5 text-gray-700">
                {user?.email}
              </CardDescription>
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="cursor-pointer">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopy}>
                  <Clipboard className="mr-2 h-4 w-4" />
                  {t("buttons.copy")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setProfileForm(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t("buttons.editProfile")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setJsonView(true)}>
                  <Code className="mr-2 h-4 w-4" />
                  {t("buttons.viewJson")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0 text-sm">
          <div className="flex justify-between border-b py-3">
            <div className="pl-4 w-1/3 text-left">{t("fields.firstName")}</div>
            <div className="w-2/3 text-left">
              {user?.firstName && user?.firstName ? user.firstName : t("empty")}
            </div>
          </div>

          <div className="flex justify-between border-b py-3">
            <div className="pl-4 w-1/3 text-left">{t("fields.lastName")}</div>
            <div className="w-2/3 text-left">
              {user?.lastName && user?.lastName ? user.lastName : t("empty")}
            </div>
          </div>

          <div className="flex justify-between border-b py-3">
            <div className="pl-4 w-1/3 text-left">{t("fields.email")}</div>
            <div className="w-2/3 text-left">{user?.email || t("empty")}</div>
          </div>

          <div className="flex justify-between border-b py-3">
            <div className="pl-4 w-1/3 text-left">{t("fields.status")}</div>
            <div className="w-2/3 text-left capitalize">
              {user?.status || t("empty")}
            </div>
          </div>

          <div className="flex justify-between border-b py-3">
            <div className="pl-4 w-1/3 text-left">{t("fields.roles")}</div>
            <div className="w-2/3 text-left">
              {user?.roles?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.roles.map((role, index) => (
                    <Badge key={index} variant="outline">
                      {role}
                    </Badge>
                  ))}
                </div>
              ) : (
                t("empty")
              )}
            </div>
          </div>

          <div className="flex justify-between border-b py-3">
            <div className="pl-4 w-1/3 text-left">{t("fields.createdAt")}</div>
            <div className="w-2/3 text-left">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleString()
                : t("empty")}
            </div>
          </div>

          <div className="flex justify-between py-3">
            <div className="pl-4 w-1/3 text-left">{t("fields.updatedAt")}</div>
            <div className="w-2/3 text-left">
              {user?.updatedAt
                ? new Date(user.updatedAt).toLocaleString()
                : t("empty")}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
