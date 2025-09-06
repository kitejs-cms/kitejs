import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { useTranslation } from "react-i18next";

interface UserConsent {
  consentType: string;
  given: boolean;
  timestamp: string;
}

interface UserConsentsCardProps {
  consents?: UserConsent[];
}

export function UserConsentsCard({ consents }: UserConsentsCardProps) {
  const { t } = useTranslation("users");

  return (
    <Card className="w-full md:w-1/3 shadow-neutral-50 gap-0 py-0">
      <CardHeader className="bg-neutral-50 py-4 rounded-t-xl">
        <CardTitle>{t("consentsCard.title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 text-sm pb-4">
        {consents && consents.length > 0 ? (
          consents.map((consent, index) => (
            <div key={index} className="flex justify-between border-b py-3">
              <div className="pl-4 w-1/3 text-left">{consent.consentType}</div>
              <div className="w-1/3 text-left">
                {consent.given
                  ? "true"
                  : `false${!consent.timestamp ? ` (${t("consentsCard.neverGiven")})` : ""}`}
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
