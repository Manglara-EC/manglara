"use client";

import { useTranslation } from "react-i18next";
import Link from "next/link";
import { HomeIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { TypographyH1 } from "@/shared/components/ui/typography";

export function NotFoundContent() {
  const { t: tCommon } = useTranslation("common");

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <TypographyH1 className="text-center">
        {tCommon("notFound.text.title")}
      </TypographyH1>

      <Button asChild className="flex items-center gap-2">
        <Link href="/home">
          <HomeIcon /> {tCommon("notFound.actions.goHome")}
        </Link>
      </Button>
    </div>
  );
}
