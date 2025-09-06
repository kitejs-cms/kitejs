import { Separator } from "../../../components/ui/separator";
import { Skeleton } from "../../../components/ui/skeleton";
import { Switch } from "../../../components/ui/switch";
import { Button } from "../../../components/ui/button";
import { useTranslation } from "react-i18next";
import { History as HistoryIcon, XIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useApi } from "../../../hooks/use-api";
import { useAuthContext } from "../../../context/auth-context";
import { Badge } from "../../../components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "../../../components/ui/dialog";

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

interface ConsentHistory {
  id: string;
  content: string;
  createdAt: string;
  createdBy?: string;
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
  const { t, i18n } = useTranslation("users");
  const en = i18n.getFixedT("en", "users");
  const { user: currentUser } = useAuthContext();
  const { fetchData: updateConsents } = useApi<UserConsent[]>();
  const { fetchData: addNote } = useApi<void>();
  const { fetchData: loadHistory } = useApi<ConsentHistory[]>();
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<ConsentHistory[]>([]);
  const [selected, setSelected] = useState<{
    slug: string;
    name: string;
    given: boolean;
  } | null>(null);

  useEffect(() => {
    if (!historyOpen) return;
    (async () => {
      setHistoryLoading(true);
      try {
        const { data } = await loadHistory(
          `notes?targetType=user&targetId=${userId}&source=consent`
        );
        setHistory(data || []);
      } finally {
        setHistoryLoading(false);
      }
    })();
  }, [historyOpen, loadHistory, userId]);

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
              <div className="flex-1 pl-4">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3 mt-1" />
              </div>
              <Skeleton className="h-6 w-10 mr-4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const consentMap = new Map((consents || []).map((c) => [c.consentType, c]));

  const merged = definitions.map((def) => {
    const match = consentMap.get(def.slug);
    return {
      name: def.name,
      slug: def.slug,
      given: match?.given ?? false,
      timestamp: match?.timestamp,
      required: def.required,
    };
  });

  return (
    <Card className="w-full lg:w-1/4 shadow-neutral-50 gap-0 py-0 lg:self-start">
      <CardHeader className="bg-neutral-50 py-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <CardTitle>{t("consentsCard.title")}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setHistoryOpen(true)}
            title={t("consentsCard.historyButton")}
          >
            <HistoryIcon className="h-4 w-4" />
          </Button>
        </div>
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
              <div className="flex-1 pl-4 text-left">
                <div>{consent.name}</div>
                <div className="text-xs text-neutral-500">
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
              <div className="pr-4">
                <Switch
                  checked={consent.given}
                  disabled={
                    !canEdit || pending || (consent.required && consent.given)
                  }
                  onCheckedChange={(checked) => {
                    if (!canEdit || (consent.required && !checked)) return;
                    setSelected({ ...consent, given: checked });
                    setConfirmOpen(true);
                  }}
                />
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
                  await updateConsents(`users/${userId}/consents`, "PATCH", {
                    consents: updated,
                  });
                  const actor = currentUser
                    ? `${currentUser.firstName ?? ""} ${
                        currentUser.lastName ?? ""
                      }`.trim() || currentUser.email
                    : "";
                  await addNote(`notes`, "POST", {
                    targetId: userId,
                    targetType: "user",
                    source: "consent",
                    content: en("consentsCard.forcedNote", {
                      actor,
                      name: selected.name,
                      status: selected.given
                        ? en("consentsCard.actions.give")
                        : en("consentsCard.actions.revoke"),
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

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="p-0 bg-white rounded-lg shadow-lg flex flex-col">
          <DialogHeader className="flex flex-row justify-between items-center p-4">
            <DialogTitle>{t("consentsCard.historyTitle")}</DialogTitle>
            <DialogClose className="flex items-center gap-2 text-gray-500 hover:text-black transition cursor-pointer">
              <Badge
                variant="outline"
                className="bg-gray-100 text-gray-400 border-gray-400 font-medium px-2 py-0.5"
              >
                Esc
              </Badge>
              <XIcon className="w-5 h-5" />
            </DialogClose>
          </DialogHeader>
          <Separator />
          <div className="p-4">
            {historyLoading ? (
              <ul className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </li>
                ))}
              </ul>
            ) : history.length ? (
              <ul className="space-y-4">
                {history.map((item) => (
                  <li key={item.id}>
                    <div>{item.content}</div>
                    <div className="mt-1 text-xs text-neutral-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center">
                {t("consentsCard.historyEmpty")}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
