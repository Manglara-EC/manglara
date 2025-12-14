"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Package, Wrench } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";

import { OrganizationItemsTableColumnHeader } from "@/features/organizations/components/organization-items-table-column-header";
import type { OrganizationItem } from "@/features/organizations/types";

export const getOrganizationItemsColumns = (isSeller: boolean = false): ColumnDef<OrganizationItem>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <OrganizationItemsTableColumnHeader column={column} title="Nombre" />
    ),
    cell: ({ row }) => {
      const item = row.original;
      const isProduct = item.type === "product";
      
      return (
        <div className="ml-2.5 flex items-center gap-2">
          {isProduct ? (
            <Package className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Wrench className="h-4 w-4 text-muted-foreground" />
          )}
          <Link
            href={`/${item.type}s/${item.id}`}
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
        currency: "EUR",
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
];
