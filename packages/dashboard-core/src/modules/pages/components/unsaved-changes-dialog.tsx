import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../../../components/ui/alert-dialog";
import { useTranslation } from "react-i18next";

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
}

export function UnsavedChangesDialog({
  isOpen,
  onClose,
  onDiscard,
}: UnsavedChangesDialogProps) {
  const { t } = useTranslation("pages");

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("unsavedChanges.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("unsavedChanges.message")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            {t("buttons.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onDiscard}>
            {t("buttons.discardChanges")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
