"use client";

import { type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { PaginationState } from "@tanstack/react-table";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/components/ui/drawer";
import type { User } from "@/shared/types";

import { BanUserForm } from "@/features/admin/components/ban-user-form";

interface Props {
  banUserDrawerTriggerRef: RefObject<HTMLButtonElement | null>;
  user: User;
  pagination: PaginationState;
}

export const BanUserDrawer = ({
  banUserDrawerTriggerRef,
  user,
  pagination,
}: Props) => {
  const { t: tAdmin } = useTranslation("admin");

  return (
    <Drawer direction="right">
      <DrawerTrigger ref={banUserDrawerTriggerRef} className="hidden" />

      <DrawerContent className="flex flex-col gap-4 p-6">
        <DrawerHeader>
          <DrawerTitle>{tAdmin("banUserDrawer.title")}</DrawerTitle>

          <DrawerDescription>
            {tAdmin("banUserDrawer.description", { name: user.name })}
          </DrawerDescription>
        </DrawerHeader>

        <div className="w-full flex-1 p-4">
          <BanUserForm userId={user.id} pagination={pagination} />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
