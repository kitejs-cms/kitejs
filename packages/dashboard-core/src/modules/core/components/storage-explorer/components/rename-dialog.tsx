import { useState, useEffect } from "react";
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

interface RenameDialogProps {
  open: boolean;
  initialName: string;
  onClose: () => void;
  onSubmit: (newName: string) => void;
}

export function RenameDialog({
  open,
  initialName,
  onClose,
  onSubmit,
}: RenameDialogProps) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (open) {
      setName(initialName);
    }
  }, [initialName, open]);

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rinomina</AlertDialogTitle>
          <AlertDialogDescription>
            Inserisci il nuovo nome per l'elemento.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="mt-4">
          <input
            type="text"
            className="w-full border rounded p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nuovo nome..."
            autoFocus
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction onClick={() => onSubmit(name)}>
            Rinomina
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
