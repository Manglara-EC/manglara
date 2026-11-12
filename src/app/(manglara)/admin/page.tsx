import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { getViewer } from "@/shared/lib/authz/server";

import { DataTable } from "@/features/admin/components/data-table";

export const metadata: Metadata = {
  title: "Manglara | Admin",
};

export default async function AdminPage() {
  // Rol leído de la BD: un admin degradado pierde el acceso de inmediato
  const viewer = await getViewer();

  if (!viewer) return redirect("/sign-in");

  if (!viewer.access.isPlatformAdmin) return redirect("/home");

  return (
    <ScrollArea className="h-full w-full">
      <div className="flex flex-col gap-6 pr-4 pb-16 pl-1">
        <div className="space-y-2">
          <TypographyH1>Administrador</TypographyH1>

          <TypographyMuted>
            Gestiona las cuentas de la plataforma: rol global, bloqueo y
            eliminación. Los roles dentro de cada comuna se gestionan desde la
            comuna. 🌴
          </TypographyMuted>
        </div>

        <DataTable />
      </div>
    </ScrollArea>
  );
}
