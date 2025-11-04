"use client";

import { LoaderIcon, RotateCcwIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { TypographyLarge } from "@/shared/components/ui/typography";

interface Props {
  refetch: () => void;
  isRefetching: boolean;
}

export const OrganizationPageHeaderError = ({
  refetch,
  isRefetching,
}: Props) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <TypographyLarge className="text-center">
        Algo salió mal al obtener los datos de la organización 😢
      </TypographyLarge>

      <Button
        variant="outline"
        onClick={() => refetch()}
        disabled={isRefetching}
      >
        {isRefetching ? (
          <LoaderIcon className="animate-spin" />
        ) : (
          <RotateCcwIcon />
        )}
        Reintentar
      </Button>
    </div>
  );
};
