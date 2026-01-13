import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import { Button } from "@/shared/components/ui/button";

import { EditServiceFormWrapper } from "@/features/seller/components/edit-service-form-wrapper";

export const metadata: Metadata = {
  title: "Manglara | Editar Servicio",
};

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditServicePage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/seller/services">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <TypographyH1>Editar servicio</TypographyH1>
          <TypographyMuted>
            Modifica los detalles de tu servicio
          </TypographyMuted>
        </div>
      </div>

      <EditServiceFormWrapper serviceId={id} />
    </div>
  );
}
