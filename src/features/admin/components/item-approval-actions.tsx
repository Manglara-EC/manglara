"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, XIcon, LoaderIcon } from "lucide-react";
import { toast } from "sonner";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";

import { approveItem } from "@/features/admin/actions/approve-item";
import { rejectItem } from "@/features/admin/actions/reject-item";

interface Props {
  itemId: string;
  itemType: "product" | "service";
  itemName: string;
  currentStatus: string;
}

export function ItemApprovalActions({ itemId, itemType, itemName, currentStatus }: Props) {
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const approveMutation = useMutation({
    mutationFn: () => approveItem({ itemId, itemType }),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error.message);
        return;
      }
      toast.success(`${itemType === "product" ? "Producto" : "Servicio"} aprobado correctamente`);
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
    onError: () => {
      toast.error("Error al aprobar");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectItem({ itemId, itemType, reason: rejectReason }),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error.message);
        return;
      }
      toast.success(`${itemType === "product" ? "Producto" : "Servicio"} rechazado`);
      setRejectDialogOpen(false);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
    onError: () => {
      toast.error("Error al rechazar");
    },
  });

  const isPending = approveMutation.isPending || rejectMutation.isPending;

  // Si ya está aprobado o rechazado, mostrar estado diferente
  if (currentStatus === "approved") {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">Aprobado</span>
      </div>
    );
  }

  if (currentStatus === "rejected") {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">Rechazado</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {/* Botón Aprobar */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
            disabled={isPending}
          >
            {approveMutation.isPending ? (
              <LoaderIcon className="h-4 w-4 animate-spin" />
            ) : (
              <CheckIcon className="h-4 w-4" />
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Aprobar este {itemType === "product" ? "producto" : "servicio"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a aprobar &quot;{itemName}&quot;. Una vez aprobado, estará visible para los compradores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => approveMutation.mutate()}
              className="bg-green-600 hover:bg-green-700"
            >
              Aprobar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Botón Rechazar */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={isPending}
          >
            {rejectMutation.isPending ? (
              <LoaderIcon className="h-4 w-4 animate-spin" />
            ) : (
              <XIcon className="h-4 w-4" />
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar {itemType === "product" ? "producto" : "servicio"}</DialogTitle>
            <DialogDescription>
              Vas a rechazar &quot;{itemName}&quot;. Por favor indica la razón del rechazo para que el vendedor pueda corregirlo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Razón del rechazo</Label>
            <Textarea
              id="reason"
              placeholder="Ej: La descripción no cumple con las políticas, las imágenes son inapropiadas..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-24"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate()}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending && <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />}
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
