"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoaderIcon, UserPlusIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  TypographyH4,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import {
  ORGANIZATION_ROLE_DISPLAY_NAMES,
  OrganizationRole,
} from "@/shared/constants/roles";

import { addOrganizationMember } from "@/features/organizations/actions/manage-members";

interface Props {
  organizationId: string;
}

/**
 * Exclusivo del administrador global: agrega una cuenta existente a la comuna
 * con un rol (por ejemplo, para designar al administrador de la comuna).
 */
export function AddOrganizationMember({ organizationId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState<OrganizationRole>(OrganizationRole.OWNER);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const { data, error } = await addOrganizationMember({
        organizationId,
        identifier,
        role,
      });

      if (error) return Promise.reject(error);

      return data;
    },
    onSuccess: () => {
      toast.success("Miembro agregado a la comuna");
      setIdentifier("");
      queryClient.invalidateQueries({
        queryKey: ["organization", organizationId],
      });
      router.refresh();
    },
    onError: (error: { message?: string }) => {
      toast.error("No se pudo agregar al miembro", {
        description: error.message,
      });
    },
  });

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div className="space-y-1">
        <TypographyH4>Asignar miembro</TypographyH4>
        <TypographyMuted>
          Como administrador global puedes agregar una cuenta existente y
          designar, por ejemplo, al administrador de la comuna.
        </TypographyMuted>
      </div>

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          mutate();
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="add-member-identifier">Correo o usuario</Label>
          <Input
            id="add-member-identifier"
            className="w-64"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="usuario o correo@dominio.com"
            disabled={isPending}
          />
        </div>

        <div className="grid gap-2">
          <Label>Rol</Label>
          <Select
            value={role}
            onValueChange={(value) => setRole(value as OrganizationRole)}
            disabled={isPending}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(OrganizationRole).map((value) => (
                <SelectItem key={value} value={value}>
                  {ORGANIZATION_ROLE_DISPLAY_NAMES[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          disabled={isPending || identifier.trim().length < 3}
        >
          {isPending ? (
            <LoaderIcon className="animate-spin" />
          ) : (
            <UserPlusIcon />
          )}
          Agregar
        </Button>
      </form>
    </div>
  );
}
