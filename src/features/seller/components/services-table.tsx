"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusIcon, EyeIcon, PencilIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
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
import { Skeleton } from "@/shared/components/ui/skeleton";

import type { ServiceWithOrg, ServiceType } from "@/features/seller/types";
import { SERVICE_TYPE_LABELS } from "@/features/seller/types";
import { useDeleteServiceMutation } from "@/features/seller/hooks/use-delete-service-mutation";

interface Props {
  services: ServiceWithOrg[];
  isLoading?: boolean;
}

// Labels de estado
const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendiente", variant: "secondary" },
  approved: { label: "Aprobado", variant: "default" },
  rejected: { label: "Rechazado", variant: "destructive" },
};

export function ServicesTable({ services, isLoading }: Props) {
  if (isLoading) {
    return <ServicesTableSkeleton />;
  }

  if (services.length === 0) {
    return <EmptyServicesState />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tus servicios</CardTitle>
        <CardDescription>
          {services.length} servicio{services.length !== 1 ? "s" : ""} en total
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Organización</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <ServiceRow key={service.id} service={service} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ServiceRow({ service }: { service: ServiceWithOrg }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { mutate: deleteService, isPending: isDeleting } = useDeleteServiceMutation();

  const statusInfo = STATUS_LABELS[service.status] || STATUS_LABELS.pending;
  const serviceTypeLabel = SERVICE_TYPE_LABELS[service.serviceType as ServiceType] || service.serviceType;
  const canDelete = service.status === "pending";

  const handleDelete = () => {
    deleteService(service.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">
          <div className="flex flex-col">
            <span className="truncate max-w-[200px]">{service.name}</span>
            {service.description && (
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                {service.description}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline">{serviceTypeLabel}</Badge>
        </TableCell>
        <TableCell>
          <span className="text-sm text-muted-foreground">
            {service.organizationName}
          </span>
        </TableCell>
        <TableCell>
          <span className="font-mono">
            ${parseFloat(service.price).toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground ml-1">
            /{service.priceUnit}
          </span>
        </TableCell>
        <TableCell>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isDeleting}>
                <MoreHorizontalIcon className="h-4 w-4" />
                <span className="sr-only">Acciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/seller/services/${service.id}`}>
                  <EyeIcon className="mr-2 h-4 w-4" />
                  Ver detalle
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/seller/services/${service.id}/edit`}>
                  <PencilIcon className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2Icon className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar &quot;{service.name}&quot;? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EmptyServicesState() {
  return (
    <Card>
      <CardContent className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <PlusIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No tienes servicios aún</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Crea tu primer servicio para empezar a vender. Puedes ofrecer
          alojamientos, actividades, servicios por tiempo y más.
        </p>
        <Button asChild>
          <Link href="/seller/services/create">
            <PlusIcon className="mr-2 h-4 w-4" />
            Crear mi primer servicio
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ServicesTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-12 flex-1" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
