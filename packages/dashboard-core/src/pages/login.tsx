import { GalleryVerticalEnd } from "lucide-react";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { useTranslation } from "react-i18next";
import { useSettingsContext } from "../context/settings-context";
import { useAuthContext } from "../context/auth-context";
import { useState } from "react";

export function LoginPage() {
  const { login } = useAuthContext();
  const { cmsSettings } = useSettingsContext();
  const { t } = useTranslation("login");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    setError(null);
    const { error } = await login(email, password);

    if (error) setError(t("errors.generic"));
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center gap-2">
            <a href="#" className="flex items-center gap-2 font-medium">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <GalleryVerticalEnd className="size-4" />
              </div>
              {cmsSettings?.siteName}
            </a>
          </div>
          <CardTitle className="mt-4 text-center text-xl">
            {t("title")}
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
          <Separator className="my-4" />
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">{t("fields.email")}</Label>{" "}
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("placeholders.email")}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">{t("fields.password")}</Label>{" "}
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    {t("forgotPassword")}
                  </a>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t("placeholders.password")}
                  required
                />
              </div>
              {error && (
                <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full">
                {t("buttons.login")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
