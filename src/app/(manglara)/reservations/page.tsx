import type { Metadata } from "next";
import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import { CustomerBookingsList } from "@/features/services/components/customer-bookings-list";

export const metadata: Metadata = {
  title: "Manglara | Mis actividades",
  description: "Consulta tus reservas y compras en Manglara",
};

export default function ReservationsPage() {
  return (
    <main className="flex flex-col gap-6 max-w-6xl mx-auto pb-12">
      <div className="space-y-1">
        <TypographyH1>Mis actividades</TypographyH1>
        <TypographyMuted>
          Revisa tus reservas programadas y compras realizadas.
        </TypographyMuted>
      </div>

      <CustomerBookingsList />
    </main>
  );
}
