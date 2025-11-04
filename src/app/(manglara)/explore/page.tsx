import type { Metadata } from "next";

import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";

export const metadata: Metadata = {
  title: "Manglara | Explore",
};

export default function ExplorePage() {
  return (
    <main className="flex flex-col gap-6">
      <div className="space-y-2">
        <TypographyH1>Explorar</TypographyH1>

        <TypographyMuted>Explora el mundo de Manglara. 🌴</TypographyMuted>
      </div>
    </main>
  );
}
