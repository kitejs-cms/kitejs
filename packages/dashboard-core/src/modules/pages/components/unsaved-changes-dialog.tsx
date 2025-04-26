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
          <AlertDialogTitle>
            {t("settings.unsaved_changes.title", "Unsaved Changes")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              "settings.unsaved_changes.description",
              "You have unsaved changes. Are you sure you want to leave?"
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            {t("settings.unsaved_changes.cancel", "Cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onDiscard();
            }}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {t("settings.unsaved_changes.confirm", "Close without saving")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
