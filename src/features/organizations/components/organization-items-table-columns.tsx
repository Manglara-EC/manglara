"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Package, Wrench, EyeIcon } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";

import { OrganizationItemsTableColumnHeader } from "@/features/organizations/components/organization-items-table-column-header";
import { ItemApprovalActions } from "@/features/admin/components/item-approval-actions";
import type { OrganizationItem } from "@/features/organizations/types";

export const getOrganizationItemsColumns = (isSeller: boolean = false, isAdmin: boolean = false): ColumnDef<OrganizationItem>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <OrganizationItemsTableColumnHeader column={column} title="Nombre" />
    ),
    cell: ({ row }) => {
      const item = row.original;
      const isProduct = item.type === "product";
      
      // Para admin, enlazar a la página de detalle de admin
      const href = isAdmin 
        ? `/admin/items/${item.type}/${item.id}`
        : `/${item.type}s/${item.id}`;
      
      return (
        <div className="ml-2.5 flex items-center gap-2">
          {isProduct ? (
            <Package className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Wrench className="h-4 w-4 text-muted-foreground" />
          )}
          <Link
            href={href}
            className="font-medium hover:underline"
          >
            {item.name}
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <OrganizationItemsTableColumnHeader column={column} title="Tipo" />
    ),
    cell: ({ row }) => {
      const isProduct = row.original.type === "product";
      return (
        <div className="ml-2.5">
          <Badge variant={isProduct ? "default" : "secondary"}>
            {isProduct ? "Producto" : "Servicio"}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <OrganizationItemsTableColumnHeader column={column} title="Precio" />
    ),
    cell: ({ row }) => {
      const price = new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "USD",
      }).format(Number(row.original.price));
      
      return (
        <div className="ml-2.5 font-medium">
          {price}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <OrganizationItemsTableColumnHeader column={column} title="Estado" />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
        pending: { label: "Pendiente", variant: "outline" },
        approved: { label: "Aprobado", variant: "default" },
        rejected: { label: "Rechazado", variant: "destructive" },
      };
      
      const statusInfo = statusMap[status] || { label: status, variant: "secondary" as const };
      
      return (
        <div className="ml-2.5">
          <Badge variant={statusInfo.variant}>
            {statusInfo.label}
          </Badge>
        </div>
      );
    },
  },
  // Columnas de seller (stock y ventas)
  ...(isSeller ? [
    {
      accessorKey: "stock",
      header: ({ column }) => (
        <OrganizationItemsTableColumnHeader column={column} title="Stock" />
      ),
      cell: ({ row }) => {
        const item = row.original;
        if (item.type !== "product") return <div className="ml-2.5">-</div>;
        return (
          <div className="ml-2.5 font-medium">
            {item.stock ?? 0}
          </div>
        );
      },
    } as ColumnDef<OrganizationItem>,
    {
      accessorKey: "sales",
      header: ({ column }) => (
        <OrganizationItemsTableColumnHeader column={column} title="Ventas" />
      ),
      cell: ({ row }) => {
        const item = row.original;
        if (item.type !== "product") return <div className="ml-2.5">-</div>;
        return (
          <div className="ml-2.5 font-medium">
            {item.sales ?? 0}
          </div>
        );
      },
    } as ColumnDef<OrganizationItem>,
  ] : []),
  // Columna de acciones para admin
  ...(isAdmin ? [
    {
      id: "actions",
      header: () => <div className="text-center">Acciones</div>,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center justify-center gap-2">
            <ItemApprovalActions
              itemId={item.id}
              itemType={item.type}
              itemName={item.name}
              currentStatus={item.status}
            />
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href={`/admin/items/${item.type}/${item.id}`}>
                <EyeIcon className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        );
      },
    } as ColumnDef<OrganizationItem>,
  ] : []),
];
