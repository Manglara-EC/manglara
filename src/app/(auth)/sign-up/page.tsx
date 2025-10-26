import type { Metadata } from "next";
import Link from "next/link";
import { TreePalmIcon } from "lucide-react";

import { SignUpForm } from "@/features/auth/components/sign-up-form";

export const metadata: Metadata = {
  title: "Manglara | Registrarse",
  description: "Regístrate en Manglara",
};

export default function SignUpPage() {
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
      <SignUpForm />
    </div>
  );
}
