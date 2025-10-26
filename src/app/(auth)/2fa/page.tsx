import type { Metadata } from "next";
import Link from "next/link";
import { TreePalmIcon } from "lucide-react";

import { TwoFactorForm } from "@/features/auth/components/two-factor-form";

export const metadata: Metadata = {
  title: "Manglara | 2FA",
  description: "2FA para tu cuenta",
};

export default function TwoFactorPage() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Link
        href="/"
        className="flex items-center gap-2 self-center font-medium"
      >
        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
          <TreePalmIcon className="size-4" />
        </div>
        Manglara
      </Link>

      <TwoFactorForm />
    </div>
  );
}
