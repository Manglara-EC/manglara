"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogInIcon, UserPlusIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { buildAuthURL } from "@/shared/utils/redirect";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

export const NavGuest = () => {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();

  const handleThemeChange = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

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

      <Button
        type="button"
        variant="ghost"
        title="Cambiar tema"
        onClick={handleThemeChange}
        className="w-full justify-start"
      >
        {resolvedTheme === "dark" ? <MoonIcon /> : <SunIcon />}
        <span className="hidden md:inline">Cambiar tema</span>
      </Button>
    </div>
  );
};
