import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@kitejs-cms/dashboard-core";
import { useTranslation } from "react-i18next";

interface DeleteDialogProps {
  isOpen: boolean;
  name?: string;
  onClose: () => void;
  onDelete: () => void;
}

export function DeleteDialog({
  name,
  isOpen,
  onClose,
  onDelete,
}: DeleteDialogProps) {
  const { t } = useTranslation("gallery");

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {name ? (
              <>
                {t("deleteDialog.messageWithNamePrefix")}
                <strong>&quot;{name}&quot;</strong>
                {t("deleteDialog.messageWithNameSuffix")}
              </>
            ) : (
              t("deleteDialog.message")
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            {t("buttons.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onDelete}>
            {t("buttons.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
