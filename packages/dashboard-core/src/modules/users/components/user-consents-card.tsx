import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";
import { Separator } from "../../../components/ui/separator";
import { Skeleton } from "../../../components/ui/skeleton";
import { Switch } from "../../../components/ui/switch";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import { useState } from "react";
import { useApi } from "../../../hooks/use-api";

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
  userId: string;
  consents?: UserConsent[];
  definitions?: ConsentDefinition[];
  loading?: boolean;
  canEdit?: boolean;
  onUpdated?: () => void;
}

export function UserConsentsCard({
  userId,
  consents,
  definitions,
  loading,
  canEdit,
  onUpdated,
}: UserConsentsCardProps) {
  const { t } = useTranslation("users");
  const { fetchData: updateConsents } = useApi<UserConsent[]>();
  const { fetchData: addNote } = useApi<void>();
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<
    | {
        slug: string;
        name: string;
        given: boolean;
      }
    | null
  >(null);

  if (loading || !definitions) {
    return (
      <Card className="w-full lg:w-1/4 shadow-neutral-50 gap-0 py-0 lg:self-start">
        <CardHeader className="bg-neutral-50 py-4 rounded-t-xl">
          <CardTitle>{t("consentsCard.title")}</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0 text-sm pb-4">
          {[0, 1, 2].map((i, index) => (
            <div
              key={i}
              className={`flex items-center justify-between py-3 ${
                index < 2 ? "border-b" : ""
              }`}
            >
              <Skeleton className="h-4 w-1/3 ml-4" />
              <Skeleton className="h-6 w-10" />
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
      slug: def.slug,
      given: match?.given ?? false,
      timestamp: match?.timestamp,
    };
  });

  return (
    <Card className="w-full lg:w-1/4 shadow-neutral-50 gap-0 py-0 lg:self-start">
      <CardHeader className="bg-neutral-50 py-4 rounded-t-xl">
        <CardTitle>{t("consentsCard.title")}</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="p-0 text-sm pb-4">
        {merged.length > 0 ? (
          merged.map((consent, index) => (
            <div
              key={index}
              className={`flex items-center justify-between py-3 ${
                index < merged.length - 1 ? "border-b" : ""
              }`}
            >
              <div className="pl-4 w-1/3 text-left">{consent.name}</div>
              <div className="w-1/3 flex justify-center">
                <Switch
                  checked={consent.given}
                  disabled={!canEdit || pending}
                  onCheckedChange={(checked) => {
                    if (!canEdit) return;
                    setSelected({ ...consent, given: checked });
                    setConfirmOpen(true);
                  }}
                />
              </div>
              <div className="w-1/3 text-left pr-4">
                {consent.given
                  ? consent.timestamp
                    ? new Date(consent.timestamp).toLocaleString()
                    : t("empty")
                  : `${t("consentsCard.notGiven")}${
                      !consent.timestamp
                        ? ` (${t("consentsCard.neverGiven")})`
                        : ""
                    }`}
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center">{t("consentsCard.noConsents")}</div>
        )}
      </CardContent>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("consentsCard.confirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("consentsCard.confirmDescription", {
                action: selected?.given
                  ? t("consentsCard.actions.give")
                  : t("consentsCard.actions.revoke"),
                name: selected?.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("buttons.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!selected) return;
                setPending(true);
                try {
                  const updated = merged.map((c) => ({
                    consentType: c.slug,
                    given: c.slug === selected.slug ? selected.given : c.given,
                  }));
                  await updateConsents(
                    `users/${userId}/consents`,
                    "PATCH",
                    { consents: updated }
                  );
                  await addNote(`notes`, "POST", {
                    targetId: userId,
                    targetType: "user",
                    source: "system",
                    content: t("consentsCard.forcedNote", {
                      name: selected.name,
                      status: selected.given
                        ? t("consentsCard.actions.give")
                        : t("consentsCard.actions.revoke"),
                    }),
                  });
                  onUpdated?.();
                } finally {
                  setPending(false);
                  setConfirmOpen(false);
                  setSelected(null);
                }
              }}
            >
              {t("buttons.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
