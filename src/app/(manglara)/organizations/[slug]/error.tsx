"use client"; // Error boundaries must be Client Components

import { Button } from "@/shared/components/ui/button";
import { TypographyH1 } from "@/shared/components/ui/typography";
import { RotateCcwIcon } from "lucide-react";
import { useEffect } from "react";

interface Props {
  reset: () => void;
}

export default function Error({ reset }: Props) {
  useEffect(() => {
    document.title = "Manglara | Error";
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <TypographyH1 className="text-center">Algo salió mal</TypographyH1>

      <Button onClick={reset} className="flex items-center gap-2">
        <RotateCcwIcon /> Recargar página
      </Button>
    </div>
  );
}
