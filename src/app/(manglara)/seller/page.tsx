import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Manglara | Panel del Vendedor",
};

export default function SellerPage() {
  // Redirigir al dashboard por defecto
  redirect("/seller/dashboard");
}
