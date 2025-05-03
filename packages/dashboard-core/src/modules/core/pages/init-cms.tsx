import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Separator } from "../../../components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { useSettingsContext } from "../../../context/settings-context";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { useApi } from "../../../hooks/use-api";
import { Textarea } from "../../../components/ui/textarea";

const languages = [
  { code: "en", name: "English" },
  { code: "it", name: "Italiano" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
];

export function InitCmsPage() {
  const { t, i18n } = useTranslation("init-cms");
  const { cmsSettings } = useSettingsContext();
  const [step, setStep] = useState(1);
  const [isConfigured, setIsConfigured] = useState(false);
  const [genericError, setGenericError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { fetchData } = useApi();

  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])/;

  useEffect(() => {
    if (cmsSettings) navigate("/");
  }, [cmsSettings, navigate]);

  const formSchema = z
    .object({
      adminEmail: z.string().email({ message: t("validation.email") }),
      adminPassword: z
        .string()
        .min(6, { message: t("validation.passwordMin") })
        .regex(passwordRegex, { message: t("validation.passwordStrength") }),
      confirmPassword: z
        .string()
        .min(6, { message: t("validation.passwordMin") }),
      adminFirstName: z.string().min(2, {
        message: t("validation.minCharacters", { min: 2 }),
      }),
      adminLastName: z.string().min(2, {
        message: t("validation.minCharacters", { min: 2 }),
      }),
      siteName: z.string().min(3, {
        message: t("validation.minCharacters", { min: 3 }),
      }),
      siteUrl: z.string().url({ message: t("validation.url") }),
      siteDescription: z.string().optional(),
      defaultLanguage: z.string().min(2, {
        message: t("validation.required"),
      }),
    })
    .refine((data) => data.adminPassword === data.confirmPassword, {
      message: t("validation.passwordMismatch"),
      path: ["confirmPassword"],
    });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      adminEmail: "",
      adminPassword: "",
      confirmPassword: "",
      adminFirstName: "",
      adminLastName: "",
      siteName: "",
      siteUrl: "",
      siteDescription: "",
      defaultLanguage: "en",
    },
  });

  useEffect(() => {
    form.setValue("defaultLanguage", i18n.language.split("-")[0]);
  }, [form, i18n.language]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setGenericError(null); // Resetta l'errore generico
      delete values.confirmPassword; // Rimuovi il campo di conferma password

      const { data, error } = await fetchData(
        "settings/init-cms",
        "POST",
        values
      );

      if (error) {
        // Mostra un errore generico all'utente
        setGenericError(t("errors.generic"));
        // Logga l'errore in console per debug
        console.error("Errore durante la configurazione del CMS:", error);
      } else if (data) {
        setIsConfigured(true); // Configurazione completata con successo
      }
    } catch (err) {
      // Gestisci errori inaspettati
      setGenericError(t("errors.generic"));
      console.error("Errore inaspettato:", err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-xl">
            {isConfigured
              ? t("success.title")
              : step === 1
                ? t("steps.admin.title")
                : t("steps.cms.title")}
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            {isConfigured
              ? t("success.subTitle")
              : step === 1
                ? t("steps.admin.description")
                : t("steps.cms.description")}
          </p>
          <Separator className="my-4 mb-0" />
        </CardHeader>

        <CardContent>
          {isConfigured ? (
            <>
              <CardHeader className="text-center p-6">
                {/* Icona e titolo */}
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <CardTitle className="text-xl text-green-600">
                    {t("success.title")}
                  </CardTitle>
                </div>
                {/* Messaggio di successo */}
                <p className="text-muted-foreground text-sm mt-2">
                  {t("success.message")}
                </p>
              </CardHeader>
              {/* Bottone per andare al login */}
              <div className="mt-4">
                <Button className="w-full" onClick={() => navigate("/login")}>
                  {t("buttons.goToLogin")}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Mostra l'errore generico */}
              {genericError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                  {genericError}
                </div>
              )}
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {step === 1 ? (
                    <>
                      <FormField
                        control={form.control}
                        name="adminFirstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("fields.adminFirstName")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("placeholders.adminFirstName")}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="adminLastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("fields.adminLastName")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("placeholders.adminLastName")}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="adminEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("fields.adminEmail")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("placeholders.adminEmail")}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="adminPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("fields.adminPassword")}</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="********"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("fields.confirmPassword")}</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="********"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        className="w-full"
                        onClick={async () => {
                          const isStepValid = await form.trigger([
                            "adminFirstName",
                            "adminLastName",
                            "adminEmail",
                            "adminPassword",
                            "confirmPassword",
                          ]);

                          if (isStepValid) {
                            setStep(2);
                          }
                        }}
                      >
                        {t("buttons.next")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="siteName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("fields.siteName")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("placeholders.siteName")}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="siteUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("fields.siteUrl")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("placeholders.siteUrl")}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="siteDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("fields.siteDescription")}</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={t("placeholders.siteDescription")}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="defaultLanguage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("fields.defaultLanguage")}</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={t(
                                      "placeholders.defaultLanguage"
                                    )}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {languages.map((language, key) => (
                                    <SelectItem key={key} value={language.code}>
                                      {language.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep(1)}
                        >
                          {t("buttons.back")}
                        </Button>
                        <Button type="submit">{t("buttons.submit")}</Button>
                      </div>
                    </>
                  )}
                </form>
              </Form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
