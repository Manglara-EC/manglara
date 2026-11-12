"use client";

import {
  CheckIcon,
  EllipsisIcon,
  LoaderIcon,
  LogOutIcon,
  MoonIcon,
  SunIcon,
  TreePalmIcon,
} from "lucide-react";
import { useTheme } from "next-themes";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { useNavUser } from "@/shared/hooks/use-nav-user";
import type { Session } from "@/shared/types";

interface Props {
  user: Session["user"];
}

export const NavUser = ({ user }: Props) => {
  const { isMobile, handleSignOut, isSigningOut } = useNavUser();
  const { theme, setTheme } = useTheme();

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger>
          <div className="relative">
            <Avatar className="size-10">
              <AvatarImage src={user.image || undefined} alt={user.name} />

              <AvatarFallback>
                {user.name
                  ?.split(" ")
                  .map((name) => name[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <span className="border-background absolute -end-0.5 -bottom-0.5 size-3 rounded-full border-2 bg-emerald-500">
              <span className="sr-only">En línea</span>
            </span>
          </div>
        </DrawerTrigger>

        <DrawerContent className="pb-4">
          <DrawerHeader>
            <DrawerTitle>Mi cuenta</DrawerTitle>

            <DrawerDescription className="sr-only">
              La configuración y preferencias de tu cuenta.
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex flex-col gap-2 px-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Apariencia</span>

              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => setTheme("tropical")}
              >
                <TreePalmIcon className="h-4 w-4" />
                Playa / Tropical
                {theme === "tropical" && (
                  <CheckIcon className="ml-auto h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => setTheme("light")}
              >
                <SunIcon className="h-4 w-4" />
                Claro
                {theme === "light" && <CheckIcon className="ml-auto h-4 w-4" />}
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => setTheme("dark")}
              >
                <MoonIcon className="h-4 w-4" />
                Oscuro
                {theme === "dark" && <CheckIcon className="ml-auto h-4 w-4" />}
              </Button>
            </div>

            <Button
              variant="ghost"
              className="text-destructive w-full justify-start !p-0"
              onClick={() => handleSignOut()}
            >
              {isSigningOut ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                <LogOutIcon />
              )}
              Cerrar sesión
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <div className="flex w-full items-center gap-4">
      <div className="relative">
        <Avatar className="size-10">
          <AvatarImage src={user.image || undefined} alt={user.name} />
          <AvatarFallback>
            {user.name
              ?.split(" ")
              .map((name) => name[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <span className="border-background absolute -end-0.5 -bottom-0.5 size-3 rounded-full border-2 bg-emerald-500">
          <span className="sr-only">En línea</span>
        </span>
      </div>

      <div className="hidden flex-col overflow-hidden sm:flex">
        <span className="text-sm font-semibold text-ellipsis">{user.name}</span>
        <span className="text-muted-foreground text-xs text-ellipsis">
          @{user.displayUsername}
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="hidden rounded-full sm:flex"
          >
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuLabel>Apariencia</DropdownMenuLabel>

          <DropdownMenuItem onSelect={() => setTheme("tropical")}>
            <TreePalmIcon className="h-4 w-4" />
            Playa / Tropical
            {theme === "tropical" && <CheckIcon className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => setTheme("light")}>
            <SunIcon className="h-4 w-4" />
            Claro
            {theme === "light" && <CheckIcon className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => setTheme("dark")}>
            <MoonIcon className="h-4 w-4" />
            Oscuro
            {theme === "dark" && <CheckIcon className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>

          <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
            {isSigningOut ? (
              <LoaderIcon className="animate-spin" />
            ) : (
              <LogOutIcon />
            )}
            Cerrar sesión
            <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
