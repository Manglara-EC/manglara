import type { Metadata } from "next";
import Link from "next/link";
import { TreePalmIcon } from "lucide-react";

import { SignInForm } from "@/features/auth/components/sign-in-form";

export const metadata: Metadata = {
  title: "Manglara | Iniciar sesión",
  description: "Inicia sesión en Manglara",
};

export default function SignInPage() {
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
      <SignInForm />
    </div>
  );
}
