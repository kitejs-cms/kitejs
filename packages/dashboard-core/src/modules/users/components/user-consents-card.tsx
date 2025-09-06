import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";
import { Separator } from "../../../components/ui/separator";
import { Skeleton } from "../../../components/ui/skeleton";
import { useTranslation } from "react-i18next";

interface UserConsent {
  consentType: string;
  given: boolean;
  timestamp: string;
}

interface ConsentDefinition {
  name: string;
  slug: string;
  description?: string;
  required: boolean;
}

interface UserConsentsCardProps {
  consents?: UserConsent[];
  definitions?: ConsentDefinition[];
  loading?: boolean;
}

export function UserConsentsCard({
  consents,
  definitions,
  loading,
}: UserConsentsCardProps) {
  const { t } = useTranslation("users");

  if (loading || !definitions) {
    return (
      <Card className="w-full md:w-1/3 shadow-neutral-50 gap-0 py-0">
        <CardHeader className="bg-neutral-50 py-4 rounded-t-xl">
          <CardTitle>{t("consentsCard.title")}</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0 text-sm pb-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex justify-between border-b py-3">
              <Skeleton className="h-4 w-1/3 ml-4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/3 mr-4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const consentMap = new Map(
    (consents || []).map((c) => [c.consentType, c])
  );

  const merged = definitions.map((def) => {
    const match = consentMap.get(def.slug);
    return {
      name: def.name,
      given: match?.given ?? false,
      timestamp: match?.timestamp,
    };
  });

  return (
    <Card className="w-full md:w-1/3 shadow-neutral-50 gap-0 py-0">
      <CardHeader className="bg-neutral-50 py-4 rounded-t-xl">
        <CardTitle>{t("consentsCard.title")}</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="p-0 text-sm pb-4">
        {merged.length > 0 ? (
          merged.map((consent, index) => (
            <div key={index} className="flex justify-between border-b py-3">
              <div className="pl-4 w-1/3 text-left">{consent.name}</div>
              <div className="w-1/3 text-left">
                {consent.given
                  ? t("consentsCard.given")
                  : `${t("consentsCard.notGiven")}${
                      !consent.timestamp
                        ? ` (${t("consentsCard.neverGiven")})`
                        : ""
                    }`}
              </div>
              <div className="w-1/3 text-left pr-4">
                {consent.timestamp
                  ? new Date(consent.timestamp).toLocaleString()
                  : t("empty")}
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center">{t("consentsCard.noConsents")}</div>
        )}
      </CardContent>
    </Card>
  );
}
