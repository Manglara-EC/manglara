"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogInIcon, UserPlusIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { buildAuthURL } from "@/shared/utils/redirect";

export const NavGuest = () => {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-2">
      <Button asChild title="Iniciar sesión" aria-label="Iniciar sesión">
        <Link href={buildAuthURL("/sign-in", pathname)}>
          <LogInIcon />
          <span className="hidden md:inline">Iniciar sesión</span>
        </Link>
      </Button>

      <Button
        asChild
        variant="outline"
        title="Registrarse"
        aria-label="Registrarse"
      >
        <Link href={buildAuthURL("/sign-up", pathname)}>
          <UserPlusIcon />
          <span className="hidden md:inline">Registrarse</span>
        </Link>
      </Button>
    </div>
  );
};
