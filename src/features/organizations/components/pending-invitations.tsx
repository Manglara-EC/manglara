"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MailIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { TypographyMuted } from "@/shared/components/ui/typography";
import { authClient } from "@/shared/lib/better-auth/client";
import {
  ORGANIZATION_ROLE_DISPLAY_NAMES,
  normalizeOrganizationRole,
} from "@/shared/constants/roles";

/**
 * Invitaciones pendientes del usuario actual. Permite aceptarlas desde la app
 * aunque el correo de invitación no haya llegado.
 */
export function PendingInvitations() {
  const { data } = useQuery({
    queryKey: ["invitation", "mine"],
    queryFn: async () => {
      const { data, error } =
        await authClient.organization.listUserInvitations();

      if (error) return Promise.reject(error);

      return data.filter(
        (invitation) =>
          invitation.status === "pending" &&
          new Date(invitation.expiresAt) > new Date(),
      );
    },
  });

  if (!data || data.length === 0) return null;

  return (
    <div className="space-y-3">
      {data.map((invitation) => (
        <Card key={invitation.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <div className="flex items-center gap-3">
              <MailIcon className="text-muted-foreground size-5" />
              <div>
                <p className="font-medium">
                  Te invitaron a {invitation.organizationName}
                </p>
                <TypographyMuted>
                  Rol:{" "}
                  {
                    ORGANIZATION_ROLE_DISPLAY_NAMES[
                      normalizeOrganizationRole(invitation.role)
                    ]
                  }
                </TypographyMuted>
              </div>
            </div>

            <Button asChild size="sm">
              <Link href={`/invitations?invitationId=${invitation.id}`}>
                Ver invitación
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
