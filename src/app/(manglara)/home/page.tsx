import type { Metadata } from "next";

import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";

export const metadata: Metadata = {
  title: "Manglara | Home",
};

export default async function HomePage() {
  return (
    <main className="flex flex-col gap-6">
      <div className="space-y-2">
        <TypographyH1>Inicio</TypographyH1>

        <TypographyMuted>
          Bienvenido a la página de inicio de Manglara. 🌴
        </TypographyMuted>
      </div>
    </main>
  );
}
