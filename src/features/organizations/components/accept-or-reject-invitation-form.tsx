"use client";

import { LoaderIcon, RotateCcwIcon } from "lucide-react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { TypographyH4 } from "@/shared/components/ui/typography";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";

import { useAcceptOrRejectInvitationForm } from "@/features/organizations/hooks/use-accept-or-reject-invitation-form";

interface Props {
  invitationId: string;
}

export const AcceptOrRejectInvitationForm = ({ invitationId }: Props) => {
  const {
    data,
    isSuccess,
    isLoading,
    isError,
    refetch,
    isRefetching,
    handleAcceptInvitation,
    handleRejectInvitation,
    isAcceptInvitationPending,
    isRejectInvitationPending,
  } = useAcceptOrRejectInvitationForm({
    invitationId,
  });

  const isPending = isAcceptInvitationPending || isRejectInvitationPending;

  return (
    <div className="mt-12 flex w-full flex-col items-center justify-center gap-2">
      {isLoading && (
        <div className="bg-background/80 border-border -mt-12 flex w-full max-w-2xl flex-col items-center gap-12 rounded-4xl border p-12 shadow-2xl">
          <div className="flex w-full flex-col items-center gap-2">
            <Skeleton className="mb-2 h-8 w-2/3 md:w-1/2" />
            <Skeleton className="h-6 w-1/2 md:w-1/3" />
          </div>
          <div className="flex w-full flex-col items-center gap-4">
            <Skeleton className="h-5 w-1/2 md:w-1/3" />
          </div>
          <div className="flex w-full flex-row items-center justify-center gap-4">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center gap-2">
          <TypographyH4>
            Algo salió mal al obtener la invitación 😢
          </TypographyH4>

          <Button variant="outline" onClick={() => refetch()}>
            {isRefetching ? (
              <LoaderIcon className="animate-spin" />
            ) : (
              <RotateCcwIcon />
            )}
            Reintentar
          </Button>
        </div>
      )}

      {isSuccess && data && (
        <div className="bg-background/80 border-border -mt-12 flex w-full max-w-2xl flex-col items-center gap-12 rounded-4xl border p-12 shadow-2xl">
          <div className="flex flex-col items-center gap-2">
            <TypographyH4 className="text-2xl md:text-3xl">
              Invitación a{" "}
              <span className="text-primary text-2xl font-semibold md:text-3xl">
                {data.organizationName}
              </span>
            </TypographyH4>
            <span className="text-muted-foreground text-lg md:text-xl">
              Te ha invitado:{" "}
              <span className="font-medium">{data.inviterEmail}</span>
            </span>
          </div>

          <div className="flex flex-col items-center gap-4">
            <span className="text-muted-foreground text-base md:text-lg">
              La invitación expira&nbsp;
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help underline decoration-dotted">
                    {formatDistanceToNowStrict(new Date(data.expiresAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {format(new Date(data.expiresAt), "PPPPp", { locale: es })}
                </TooltipContent>
              </Tooltip>
            </span>
          </div>

          <div className="flex w-full flex-row justify-center gap-6">
            <Button
              className="h-14 px-8 text-lg"
              disabled={isPending}
              onClick={handleAcceptInvitation}
            >
              {isAcceptInvitationPending && (
                <LoaderIcon className="mr-3 h-6 w-6 animate-spin" />
              )}
              Aceptar invitación
            </Button>

            <Button
              variant="outline"
              className="h-14 px-8 text-lg"
              disabled={isPending}
              onClick={handleRejectInvitation}
            >
              {isRejectInvitationPending && (
                <LoaderIcon className="mr-3 h-6 w-6 animate-spin" />
              )}
              Rechazar invitación
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
