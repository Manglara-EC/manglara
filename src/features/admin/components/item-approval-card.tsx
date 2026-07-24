"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  CheckIcon,
  XIcon,
  LoaderIcon,
  AlertTriangleIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Separator } from "@/shared/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";

import { approveItem } from "@/features/admin/actions/approve-item";
import { rejectItem } from "@/features/admin/actions/reject-item";
import { deleteItem } from "@/features/admin/actions/delete-item";

interface Props {
  itemId: string;
  itemType: "product" | "service";
  itemName: string;
  currentStatus: string;
  rejectionReason?: string | null;
}

export function ItemApprovalCard({
  itemId,
  itemType,
  itemName,
  currentStatus,
  rejectionReason,
}: Props) {
  const router = useRouter();
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const approveMutation = useMutation({
    mutationFn: () => approveItem({ itemId, itemType }),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error.message);
        return;
      }
      toast.success(
        `${itemType === "product" ? "Producto" : "Servicio"} aprobado correctamente`,
      );
      router.refresh();
    },
    onError: () => {
      toast.error("Error al aprobar");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      rejectItem({ itemId, itemType, reason: rejectReasonInput }),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error.message);
        return;
      }
      toast.success(
        `${itemType === "product" ? "Producto" : "Servicio"} rechazado`,
      );
      setShowRejectForm(false);
      setRejectReasonInput("");
      router.refresh();
    },
    onError: () => {
      toast.error("Error al rechazar");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteItem({ itemId, itemType }),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error.message);
        return;
      }
      toast.success(
        `${itemType === "product" ? "Producto" : "Servicio"} eliminado correctamente`,
      );
      router.push("/admin");
    },
    onError: () => {
      toast.error("Error al eliminar");
    },
  });

  const isPending =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    deleteMutation.isPending;

  // Componente del dialog de eliminación (reutilizable)
  const DeleteDialog = () => (
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Eliminar {itemType === "product" ? "producto" : "servicio"}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas eliminar &quot;{itemName}&quot;? Esta
            acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMutation.mutate()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && (
              <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
            )}
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Botón de eliminar (reutilizable)
  const DeleteButton = () => (
    <Button
      variant="outline"
      className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
      onClick={() => setShowDeleteDialog(true)}
      disabled={isPending}
    >
      <Trash2Icon className="mr-2 h-4 w-4" />
      Eliminar permanentemente
    </Button>
  );

  // Si ya está aprobado
  if (currentStatus === "approved") {
    return (
      <>
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-300 flex items-center gap-2">
              <CheckIcon className="h-5 w-5" />
              Aprobado
            </CardTitle>
            <CardDescription>
              Este {itemType === "product" ? "producto" : "servicio"} está
              visible para los compradores.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <DeleteButton />
          </CardFooter>
        </Card>
        <DeleteDialog />
      </>
    );
  }

  // Si ya está rechazado
  if (currentStatus === "rejected") {
    return (
      <>
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-300 flex items-center gap-2">
              <XIcon className="h-5 w-5" />
              Rechazado
            </CardTitle>
            <CardDescription>
              Este {itemType === "product" ? "producto" : "servicio"} fue
              rechazado.
            </CardDescription>
          </CardHeader>
          {rejectionReason && (
            <CardContent>
              <Alert variant="destructive">
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>Razón:</strong> {rejectionReason}
                </AlertDescription>
              </Alert>
            </CardContent>
          )}
          <CardFooter className="flex flex-col gap-3">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => approveMutation.mutate()}
              disabled={isPending}
            >
              {approveMutation.isPending && (
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
              )}
              Cambiar a Aprobado
            </Button>
            <DeleteButton />
          </CardFooter>
        </Card>
        <DeleteDialog />
      </>
    );
  }

  // Si está pendiente
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Revisar {itemType === "product" ? "producto" : "servicio"}
        </CardTitle>
        <CardDescription>
          Decide si aprobar o rechazar este item para su publicación.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showRejectForm ? (
          <div className="flex flex-col gap-3">
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => approveMutation.mutate()}
              disabled={isPending}
            >
              {approveMutation.isPending ? (
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckIcon className="mr-2 h-4 w-4" />
              )}
              Aprobar
            </Button>
            <Button
              className="w-full"
              variant="destructive"
              onClick={() => setShowRejectForm(true)}
              disabled={isPending}
            >
              <XIcon className="mr-2 h-4 w-4" />
              Rechazar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Razón del rechazo</Label>
              <Textarea
                id="reject-reason"
                placeholder="Explica por qué se rechaza este item..."
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                className="min-h-24"
              />
              <p className="text-xs text-muted-foreground">
                Esta razón se mostrará al vendedor para que pueda corregir el
                problema.
              </p>
            </div>
            <Separator />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectReasonInput("");
                }}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => rejectMutation.mutate()}
                disabled={!rejectReasonInput.trim() || isPending}
              >
                {rejectMutation.isPending && (
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirmar rechazo
              </Button>
            </div>
          </div>
        )}

        <Separator />

        {/* Botón de eliminar siempre visible para admin */}
        <DeleteButton />
      </CardContent>
      <DeleteDialog />
    </Card>
  );
}
