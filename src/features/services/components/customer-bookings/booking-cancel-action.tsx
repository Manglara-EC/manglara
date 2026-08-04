import { Loader2Icon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";

interface BookingCancelActionProps {
  bookingId: string;
  serviceName: string;
  isCancelling: boolean;
  isPending: boolean;
  onCancel: (bookingId: string) => void;
}

export function BookingCancelAction({
  bookingId,
  serviceName,
  isCancelling,
  isPending,
  onCancel,
}: BookingCancelActionProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-destructive/30 text-destructive hover:bg-destructive/10"
          disabled={isCancelling || isPending}
        >
          {isCancelling ? (
            <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
          ) : (
            "Cancelar"
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Cancelar esta reserva?</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas cancelar tu reserva para{" "}
            <strong>{serviceName}</strong>? Esta acción actualizará el estado a
            cancelado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>No, mantener</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onCancel(bookingId)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Sí, cancelar reserva
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
