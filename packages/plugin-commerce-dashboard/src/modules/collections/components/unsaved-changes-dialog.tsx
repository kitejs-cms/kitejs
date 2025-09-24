import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@kitejs-cms/dashboard-core";
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
  const { t } = useTranslation("commerce");

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("collections.unsavedChanges.title")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("collections.unsavedChanges.message")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            {t("collections.buttons.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onDiscard}>
            {t("collections.buttons.discardChanges")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
