import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import { Button } from "@/shared/components/ui/button";
import { MyServicesList } from "@/features/seller/components/my-services-list";

export const metadata: Metadata = {
  title: "Manglara | Mis Servicios",
};

export default function SellerServicesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <TypographyH1>Mis Servicios</TypographyH1>
          <TypographyMuted>
            Gestiona todos tus servicios desde aquí
          </TypographyMuted>
        </div>
        <Button asChild>
          <Link href="/seller/services/create">
            <PlusIcon className="mr-2 h-4 w-4" />
            Crear servicio
          </Link>
        </Button>
      </div>

      <MyServicesList />
    </div>
  );
}
