import { Metadata } from "next";
import Link from "next/link";
import { HomeIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { TypographyH1 } from "@/shared/components/ui/typography";

export const metadata: Metadata = {
  title: "Manglara | Página no encontrada",
  description: "Página no encontrada",
};

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <TypographyH1 className="text-center">Página no encontrada</TypographyH1>

      <Button asChild className="flex items-center gap-2">
        <Link href="/home">
          <HomeIcon /> Ir a inicio
        </Link>
      </Button>
    </div>
  );
}
