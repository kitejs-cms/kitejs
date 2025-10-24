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

// 🌍 Supported languages
const languages = [
  { code: "en", name: "English" },
  { code: "it", name: "Italiano" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
];

// ✅ Schema con inferenza e regex robusta
const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{6,}$/;

const formSchema = z
  .object({
    adminEmail: z.string().email({ message: "Invalid email address" }),
    adminPassword: z
      .string()
      .min(6, { message: "At least 6 characters" })
      .regex(strongPasswordRegex, {
        message:
          "Password must contain upper, lower, number and special character",
      }),
    confirmPassword: z.string().min(6, { message: "At least 6 characters" }),
    adminFirstName: z.string().min(2, { message: "Too short" }),
    adminLastName: z.string().min(2, { message: "Too short" }),
    siteName: z.string().min(3, { message: "Too short" }),
    siteUrl: z.string().url({ message: "Invalid URL" }),
    siteDescription: z.string().optional(),
    defaultLanguage: z.string().min(2, { message: "Required" }),
  })
  .refine((data) => data.adminPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type InitCmsFormValues = z.infer<typeof formSchema>;

export function InitCmsPage() {
  const { t, i18n } = useTranslation("init-cms");
  const { cmsSettings } = useSettingsContext();
  const navigate = useNavigate();
  const { fetchData } = useApi();

  const [step, setStep] = useState(1);
  const [isConfigured, setIsConfigured] = useState(false);
  const [genericError, setGenericError] = useState<string | null>(null);

  // ✅ Se CMS già configurato → redirect alla home
  useEffect(() => {
    if (cmsSettings?.siteName) navigate("/");
  }, [cmsSettings, navigate]);

  const form = useForm<InitCmsFormValues>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
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

  // ✅ Imposta lingua predefinita dal browser / i18n
  useEffect(() => {
    form.setValue("defaultLanguage", i18n.language.split("-")[0] || "en");
  }, [i18n.language, form]);

  // ✅ Submit finale (solo step 2)
  const onSubmit = async (values: InitCmsFormValues) => {
    try {
      setGenericError(null);
      const { ...payload } = values;

      const { data, error } = await fetchData(
        "settings/init-cms",
        "POST",
        payload
      );

      if (error) {
        console.error("Errore durante la configurazione del CMS:", error);
        setGenericError(t("errors.generic"));
      } else if (data) {
        setIsConfigured(true);
      }
    } catch (err) {
      console.error("Errore inaspettato:", err);
      setGenericError(t("errors.generic"));
    }
  };

  // ✅ Validazione parziale step 1 → avanti
  const handleNext = async () => {
    const isValid = await form.trigger([
      "adminFirstName",
      "adminLastName",
      "adminEmail",
      "adminPassword",
      "confirmPassword",
    ]);
    if (isValid) setStep(2);
  };

  // ✅ Torna indietro
  const handleBack = () => setStep(1);

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
            <div className="text-center space-y-4 py-6">
              <div className="flex justify-center items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h3 className="text-green-600 font-semibold">
                  {t("success.title")}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("success.message")}
              </p>
              <Button className="w-full" onClick={() => navigate("/login")}>
                {t("buttons.goToLogin")}
              </Button>
            </div>
          ) : (
            <>
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
                  {/* STEP 1: Admin setup */}
                  {step === 1 && (
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
                        onClick={handleNext}
                      >
                        {t("buttons.next")}
                      </Button>
                    </>
                  )}

                  {/* STEP 2: Site setup */}
                  {step === 2 && (
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
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={t(
                                      "placeholders.defaultLanguage"
                                    )}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {languages.map((language) => (
                                    <SelectItem
                                      key={language.code}
                                      value={language.code}
                                    >
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
                          onClick={handleBack}
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
