import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../../../components/ui/alert-dialog";

interface NewFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (folderName: string) => void;
}

export function NewFolderDialog({
  open,
  onClose,
  onSubmit,
}: NewFolderDialogProps) {
  const [folderName, setFolderName] = useState("");

  useEffect(() => {
    if (open) {
      setFolderName("");
    }
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Crea Cartella</AlertDialogTitle>
          <AlertDialogDescription>
            Inserisci il nome della nuova cartella.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="mt-4">
          <input
            type="text"
            className="w-full border rounded p-2"
            placeholder="Nome cartella..."
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            autoFocus
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction onClick={() => onSubmit(folderName)}>
            Crea
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
