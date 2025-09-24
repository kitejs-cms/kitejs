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
} from "@kitejs-cms/dashboard-core";

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
}

export function ProductUnsavedChangesDialog({
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
            {t("products.unsavedChanges.title")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("products.unsavedChanges.message")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            {t("products.buttons.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onDiscard}>
            {t("products.buttons.discardChanges")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
